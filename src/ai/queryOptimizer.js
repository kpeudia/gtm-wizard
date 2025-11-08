const logger = require('../utils/logger');
const { cache } = require('../utils/cache');
const crypto = require('crypto');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.performanceMetrics = new Map();
    this.optimizationRules = new Map();
    this.initializeOptimizationRules();
  }

  /**
   * Initialize query optimization rules
   */
  initializeOptimizationRules() {
    // Common query patterns that can be optimized
    this.optimizationRules.set('large_result_sets', {
      condition: (entities) => !entities.limit || entities.limit > 100,
      optimization: (soql) => {
        // Add intelligent LIMIT based on intent
        if (!soql.includes('LIMIT')) {
          return soql + ' LIMIT 50';
        }
        return soql;
      }
    });

    this.optimizationRules.set('unnecessary_fields', {
      condition: (entities, intent) => intent === 'pipeline_summary',
      optimization: (soql) => {
        // Remove heavy fields for summary queries
        const heavyFields = ['Description', 'NextStep'];
        heavyFields.forEach(field => {
          soql = soql.replace(new RegExp(`,\\s*${field}`, 'gi'), '');
          soql = soql.replace(new RegExp(`${field}\\s*,`, 'gi'), '');
        });
        return soql;
      }
    });

    this.optimizationRules.set('date_range_optimization', {
      condition: (entities) => entities.timeframe && entities.timeframe !== 'custom',
      optimization: (soql) => {
        // Use Salesforce date literals instead of custom date calculations
        return soql; // Already optimized in query builder
      }
    });

    this.optimizationRules.set('index_friendly_filters', {
      condition: (entities) => entities.owners && entities.owners.length > 0,
      optimization: (soql) => {
        // Ensure owner filters use indexed fields
        return soql.replace(/Owner\.Name LIKE/g, 'OwnerId IN');
      }
    });
  }

  /**
   * Optimize SOQL query before execution
   */
  async optimizeQuery(soql, entities, intent, userId) {
    const startTime = Date.now();
    
    try {
      let optimizedSoql = soql;
      const appliedOptimizations = [];

      // Apply optimization rules
      for (const [ruleName, rule] of this.optimizationRules) {
        if (rule.condition(entities, intent)) {
          const beforeOptimization = optimizedSoql;
          optimizedSoql = rule.optimization(optimizedSoql);
          
          if (beforeOptimization !== optimizedSoql) {
            appliedOptimizations.push(ruleName);
          }
        }
      }

      // Check for similar queries in cache
      const similarQuery = await this.findSimilarQuery(optimizedSoql, entities, intent);
      if (similarQuery) {
        logger.info('🎯 Found similar cached query', {
          userId,
          cacheKey: similarQuery.key,
          similarity: similarQuery.similarity
        });
        
        // Use cached query if very similar
        if (similarQuery.similarity > 0.9) {
          return {
            soql: similarQuery.soql,
            optimized: true,
            fromCache: true,
            appliedOptimizations: ['cache_hit']
          };
        }
      }

      // Cache the optimized query
      await this.cacheOptimizedQuery(optimizedSoql, entities, intent, userId);

      const optimizationTime = Date.now() - startTime;
      
      logger.info('⚡ Query optimized', {
        userId,
        originalLength: soql.length,
        optimizedLength: optimizedSoql.length,
        appliedOptimizations,
        optimizationTime
      });

      return {
        soql: optimizedSoql,
        optimized: appliedOptimizations.length > 0,
        fromCache: false,
        appliedOptimizations
      };

    } catch (error) {
      logger.error('Query optimization failed:', error);
      // Return original query if optimization fails
      return {
        soql,
        optimized: false,
        fromCache: false,
        appliedOptimizations: [],
        error: error.message
      };
    }
  }

  /**
   * Find similar queries in cache
   */
  async findSimilarQuery(soql, entities, intent) {
    try {
      const querySignature = this.generateQuerySignature(entities, intent);
      const cacheKey = `query_opt:${querySignature}`;
      
      const cached = await cache.get(cacheKey);
      if (cached) {
        const similarity = this.calculateQuerySimilarity(soql, cached.soql);
        return {
          key: cacheKey,
          soql: cached.soql,
          similarity,
          metadata: cached.metadata
        };
      }

      return null;
    } catch (error) {
      logger.error('Error finding similar query:', error);
      return null;
    }
  }

  /**
   * Cache optimized query for future use
   */
  async cacheOptimizedQuery(soql, entities, intent, userId) {
    try {
      const querySignature = this.generateQuerySignature(entities, intent);
      const cacheKey = `query_opt:${querySignature}`;
      
      const cacheData = {
        soql,
        entities,
        intent,
        userId,
        timestamp: Date.now(),
        metadata: {
          length: soql.length,
          complexity: this.calculateQueryComplexity(soql)
        }
      };

      await cache.set(cacheKey, cacheData, 3600); // Cache for 1 hour
      
    } catch (error) {
      logger.error('Error caching optimized query:', error);
    }
  }

  /**
   * Generate query signature for caching
   */
  generateQuerySignature(entities, intent) {
    const signature = {
      intent,
      timeframe: entities.timeframe,
      stages: entities.stages?.sort(),
      segments: entities.segments?.sort(),
      owners: entities.owners?.sort(),
      accounts: entities.accounts?.sort(), // CRITICAL: Include account names
      isClosed: entities.isClosed,
      isWon: entities.isWon,
      amountThreshold: entities.amountThreshold,
      groupBy: entities.groupBy?.sort(),
      fieldType: entities.fieldType, // For account field queries
      productLine: entities.productLine // For product line queries
    };

    return crypto
      .createHash('md5')
      .update(JSON.stringify(signature))
      .digest('hex');
  }

  /**
   * Calculate similarity between two queries
   */
  calculateQuerySimilarity(query1, query2) {
    if (query1 === query2) return 1.0;

    // Normalize queries for comparison
    const normalize = (q) => q
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/'/g, '"')
      .trim();

    const norm1 = normalize(query1);
    const norm2 = normalize(query2);

    // Simple similarity based on common words
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate query complexity score
   */
  calculateQueryComplexity(soql) {
    let complexity = 0;
    
    // Base complexity
    complexity += 1;
    
    // JOIN complexity
    const joins = (soql.match(/\./g) || []).length;
    complexity += joins * 0.5;
    
    // WHERE clause complexity
    const conditions = (soql.match(/AND|OR/gi) || []).length;
    complexity += conditions * 0.3;
    
    // GROUP BY complexity
    if (soql.includes('GROUP BY')) {
      complexity += 2;
    }
    
    // Aggregation complexity
    const aggregations = (soql.match(/COUNT|SUM|AVG|MAX|MIN/gi) || []).length;
    complexity += aggregations * 0.5;
    
    return Math.round(complexity * 10) / 10;
  }

  /**
   * Track query performance for learning
   */
  async trackQueryPerformance(soql, executionTime, resultCount, userId) {
    try {
      const queryHash = crypto.createHash('md5').update(soql).digest('hex');
      const performanceKey = `perf:${queryHash}`;
      
      const existingMetrics = await cache.get(performanceKey) || {
        executions: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        avgResultCount: 0,
        totalResultCount: 0
      };

      // Update metrics
      existingMetrics.executions++;
      existingMetrics.totalTime += executionTime;
      existingMetrics.avgTime = existingMetrics.totalTime / existingMetrics.executions;
      existingMetrics.maxTime = Math.max(existingMetrics.maxTime, executionTime);
      existingMetrics.minTime = Math.min(existingMetrics.minTime, executionTime);
      existingMetrics.totalResultCount += resultCount;
      existingMetrics.avgResultCount = existingMetrics.totalResultCount / existingMetrics.executions;
      existingMetrics.lastExecution = Date.now();

      await cache.set(performanceKey, existingMetrics, 86400); // 24 hours

      // Log slow queries
      if (executionTime > 5000) { // 5 seconds
        logger.warn('🐌 Slow query detected', {
          queryHash,
          executionTime,
          resultCount,
          userId,
          avgTime: existingMetrics.avgTime
        });
      }

    } catch (error) {
      logger.error('Error tracking query performance:', error);
    }
  }

  /**
   * Get performance insights for a query
   */
  async getQueryInsights(soql) {
    try {
      const queryHash = crypto.createHash('md5').update(soql).digest('hex');
      const performanceKey = `perf:${queryHash}`;
      
      const metrics = await cache.get(performanceKey);
      if (!metrics) {
        return {
          isNew: true,
          recommendation: 'This is a new query pattern'
        };
      }

      const insights = {
        isNew: false,
        executions: metrics.executions,
        avgTime: metrics.avgTime,
        avgResultCount: metrics.avgResultCount,
        recommendations: []
      };

      // Generate recommendations
      if (metrics.avgTime > 3000) {
        insights.recommendations.push('Consider adding more specific filters to improve performance');
      }

      if (metrics.avgResultCount > 200) {
        insights.recommendations.push('This query returns many results. Consider pagination or filtering');
      }

      if (metrics.executions > 10 && metrics.avgTime > 1000) {
        insights.recommendations.push('This is a frequently used slow query. Consider caching or optimization');
      }

      return insights;

    } catch (error) {
      logger.error('Error getting query insights:', error);
      return { isNew: true, recommendation: 'Unable to analyze query performance' };
    }
  }

  /**
   * Learn from user feedback and adjust optimizations
   */
  async learnFromFeedback(queryHash, feedback, userId) {
    try {
      const feedbackKey = `feedback:${queryHash}`;
      const existingFeedback = await cache.get(feedbackKey) || {
        positive: 0,
        negative: 0,
        corrections: [],
        users: new Set()
      };

      // Update feedback metrics
      if (feedback.type === 'positive') {
        existingFeedback.positive++;
      } else if (feedback.type === 'negative') {
        existingFeedback.negative++;
      }

      // Track corrections
      if (feedback.correction) {
        existingFeedback.corrections.push({
          correction: feedback.correction,
          userId,
          timestamp: Date.now()
        });
      }

      existingFeedback.users.add(userId);

      await cache.set(feedbackKey, {
        ...existingFeedback,
        users: Array.from(existingFeedback.users)
      }, 86400 * 7); // 7 days

      // Adjust optimization rules based on feedback
      await this.adjustOptimizationRules(queryHash, feedback);

      logger.info('📚 Learning from user feedback', {
        queryHash,
        feedbackType: feedback.type,
        userId,
        totalFeedback: existingFeedback.positive + existingFeedback.negative
      });

    } catch (error) {
      logger.error('Error learning from feedback:', error);
    }
  }

  /**
   * Adjust optimization rules based on feedback
   */
  async adjustOptimizationRules(queryHash, feedback) {
    try {
      // If query consistently gets negative feedback, mark it for review
      const feedbackKey = `feedback:${queryHash}`;
      const feedbackData = await cache.get(feedbackKey);
      
      if (feedbackData && feedbackData.negative > feedbackData.positive * 2) {
        const reviewKey = `review:${queryHash}`;
        await cache.set(reviewKey, {
          queryHash,
          reason: 'negative_feedback',
          negativeCount: feedbackData.negative,
          positiveCount: feedbackData.positive,
          timestamp: Date.now()
        }, 86400 * 30); // 30 days

        logger.info('🚨 Query marked for optimization review', {
          queryHash,
          negativeCount: feedbackData.negative,
          positiveCount: feedbackData.positive
        });
      }

    } catch (error) {
      logger.error('Error adjusting optimization rules:', error);
    }
  }

  /**
   * Get optimization statistics
   */
  async getOptimizationStats() {
    try {
      // This would typically query your cache/database for stats
      return {
        totalOptimizations: this.queryCache.size,
        cacheHitRate: 0.75, // Would calculate from actual data
        avgOptimizationTime: 50, // milliseconds
        topOptimizations: [
          'large_result_sets',
          'unnecessary_fields',
          'cache_hit'
        ]
      };
    } catch (error) {
      logger.error('Error getting optimization stats:', error);
      return {};
    }
  }
}

// Export singleton instance
const queryOptimizer = new QueryOptimizer();

module.exports = {
  QueryOptimizer,
  queryOptimizer,
  
  // Convenience methods
  optimizeQuery: (soql, entities, intent, userId) => 
    queryOptimizer.optimizeQuery(soql, entities, intent, userId),
  trackQueryPerformance: (soql, executionTime, resultCount, userId) =>
    queryOptimizer.trackQueryPerformance(soql, executionTime, resultCount, userId),
  learnFromFeedback: (queryHash, feedback, userId) =>
    queryOptimizer.learnFromFeedback(queryHash, feedback, userId),
  getQueryInsights: (soql) => queryOptimizer.getQueryInsights(soql)
};
