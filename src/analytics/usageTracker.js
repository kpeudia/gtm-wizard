/**
 * Usage Analytics & ROI Tracking System
 * Tracks every query, measures success, calculates business impact
 */

class UsageTracker {
  constructor() {
    this.metrics = {
      queries: [],
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      queryCount: 0,
      userEngagement: new Map(),
      intentDistribution: new Map(),
      timeSeriesByHour: new Map(),
      errorTypes: new Map()
    };
    
    // In production, this would persist to database
    this.persistInterval = setInterval(() => this.persist(), 60000); // Every minute
  }

  /**
   * Track a query execution
   */
  trackQuery({ userId, query, intent, success, responseTime, error, metadata = {} }) {
    const timestamp = new Date();
    const hour = timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    const queryLog = {
      timestamp,
      userId,
      query: query.substring(0, 200), // Truncate for privacy
      intent,
      success,
      responseTime,
      error: error?.message,
      metadata,
      hourBucket: hour
    };
    
    // Store query (keep last 10,000 in memory, rest in DB)
    this.metrics.queries.push(queryLog);
    if (this.metrics.queries.length > 10000) {
      this.metrics.queries.shift();
    }
    
    // Update counters
    this.metrics.queryCount++;
    if (success) {
      this.metrics.successes++;
    } else {
      this.metrics.failures++;
      const errorType = error?.type || 'unknown';
      this.metrics.errorTypes.set(errorType, (this.metrics.errorTypes.get(errorType) || 0) + 1);
    }
    
    this.metrics.totalResponseTime += responseTime;
    
    // Track user engagement
    if (!this.metrics.userEngagement.has(userId)) {
      this.metrics.userEngagement.set(userId, {
        queryCount: 0,
        firstQuery: timestamp,
        lastQuery: timestamp,
        successRate: 0,
        avgResponseTime: 0,
        intents: new Map()
      });
    }
    
    const userStats = this.metrics.userEngagement.get(userId);
    userStats.queryCount++;
    userStats.lastQuery = timestamp;
    userStats.avgResponseTime = ((userStats.avgResponseTime * (userStats.queryCount - 1)) + responseTime) / userStats.queryCount;
    userStats.intents.set(intent, (userStats.intents.get(intent) || 0) + 1);
    
    // Track intent distribution
    this.metrics.intentDistribution.set(intent, (this.metrics.intentDistribution.get(intent) || 0) + 1);
    
    // Time series
    if (!this.metrics.timeSeriesByHour.has(hour)) {
      this.metrics.timeSeriesByHour.set(hour, { queries: 0, successes: 0, avgResponseTime: 0 });
    }
    const hourStats = this.metrics.timeSeriesByHour.get(hour);
    hourStats.queries++;
    if (success) hourStats.successes++;
    hourStats.avgResponseTime = ((hourStats.avgResponseTime * (hourStats.queries - 1)) + responseTime) / hourStats.queries;
  }

  /**
   * Calculate ROI metrics
   */
  calculateROI() {
    const avgResponseTime = this.metrics.totalResponseTime / this.metrics.queryCount || 0;
    const successRate = this.metrics.successes / this.metrics.queryCount || 0;
    
    // Conservative estimates
    const avgTimePerManualSearch = 3 * 60 * 1000; // 3 minutes in ms
    const blendedHourlyRate = 120; // $120/hour
    
    const totalQueriesSuccessful = this.metrics.successes;
    const timeSavedMs = totalQueriesSuccessful * (avgTimePerManualSearch - avgResponseTime);
    const timeSavedHours = timeSavedMs / (1000 * 60 * 60);
    const moneySaved = timeSavedHours * blendedHourlyRate;
    
    // Extrapolate to annual
    const daysActive = this.getDaysActive();
    const annualizedSavings = daysActive > 0 ? (moneySaved / daysActive) * 365 : 0;
    
    return {
      totalQueries: this.metrics.queryCount,
      successfulQueries: this.metrics.successes,
      failedQueries: this.metrics.failures,
      successRate: (successRate * 100).toFixed(1) + '%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      avgManualTime: '3 minutes',
      timeSavedPerQuery: Math.round((avgTimePerManualSearch - avgResponseTime) / 1000) + ' seconds',
      totalTimeSaved: Math.round(timeSavedHours) + ' hours',
      totalMoneySaved: '$' + Math.round(moneySaved).toLocaleString(),
      annualizedROI: '$' + Math.round(annualizedSavings).toLocaleString() + '/year',
      activeUsers: this.metrics.userEngagement.size,
      queriesPerActiveUser: (this.metrics.queryCount / this.metrics.userEngagement.size || 0).toFixed(1),
      daysActive: daysActive
    };
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const roi = this.calculateROI();
    
    // Top intents
    const topIntents = Array.from(this.metrics.intentDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count, percentage: ((count / this.metrics.queryCount) * 100).toFixed(1) + '%' }));
    
    // Top users
    const topUsers = Array.from(this.metrics.userEngagement.entries())
      .sort((a, b) => b[1].queryCount - a[1].queryCount)
      .slice(0, 10)
      .map(([userId, stats]) => ({
        userId,
        queries: stats.queryCount,
        avgResponseTime: Math.round(stats.avgResponseTime) + 'ms',
        topIntent: Array.from(stats.intents.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
      }));
    
    // Error analysis
    const topErrors = Array.from(this.metrics.errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count, percentage: ((count / this.metrics.failures) * 100).toFixed(1) + '%' }));
    
    // Peak usage hours
    const peakHours = Array.from(this.metrics.timeSeriesByHour.entries())
      .sort((a, b) => b[1].queries - a[1].queries)
      .slice(0, 5)
      .map(([hour, stats]) => ({ 
        hour: new Date(hour).toLocaleString(), 
        queries: stats.queries,
        successRate: ((stats.successes / stats.queries) * 100).toFixed(1) + '%'
      }));
    
    return {
      roi,
      topIntents,
      topUsers,
      topErrors,
      peakHours,
      healthScore: this.calculateHealthScore()
    };
  }

  /**
   * Calculate system health score (0-100)
   */
  calculateHealthScore() {
    const successRate = this.metrics.successes / this.metrics.queryCount || 0;
    const avgResponseTime = this.metrics.totalResponseTime / this.metrics.queryCount || 0;
    
    // Health factors
    const successScore = successRate * 50; // 50 points for success rate
    const speedScore = Math.max(0, 30 - (avgResponseTime / 1000) * 10); // 30 points for speed (<3s ideal)
    const usageScore = Math.min(20, this.metrics.queryCount / 100); // 20 points for adoption
    
    return Math.round(successScore + speedScore + usageScore);
  }

  /**
   * Get days since first query
   */
  getDaysActive() {
    if (this.metrics.queries.length === 0) return 0;
    const firstQuery = this.metrics.queries[0].timestamp;
    const now = new Date();
    return Math.ceil((now - firstQuery) / (1000 * 60 * 60 * 24));
  }

  /**
   * Persist metrics (would go to database in production)
   */
  persist() {
    // In production: write to PostgreSQL/MongoDB
    console.log('[Analytics] Metrics persisted:', {
      queryCount: this.metrics.queryCount,
      successRate: ((this.metrics.successes / this.metrics.queryCount) * 100).toFixed(1) + '%',
      activeUsers: this.metrics.userEngagement.size
    });
  }

  /**
   * Export for dashboard/reporting
   */
  exportMetrics() {
    return {
      summary: this.getStats(),
      rawMetrics: {
        queries: this.metrics.queries.slice(-100), // Last 100 queries
        intentDistribution: Object.fromEntries(this.metrics.intentDistribution),
        userEngagement: Array.from(this.metrics.userEngagement.entries()).map(([userId, stats]) => ({
          userId,
          ...stats,
          intents: Object.fromEntries(stats.intents)
        })),
        timeSeries: Object.fromEntries(this.metrics.timeSeriesByHour)
      }
    };
  }

  cleanup() {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
  }
}

// Singleton instance
const tracker = new UsageTracker();

module.exports = {
  UsageTracker,
  tracker
};

