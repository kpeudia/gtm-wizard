/**
 * Structured Logging & Observability
 * Production-grade logging with context, tracing, and metrics
 */

class StructuredLogger {
  constructor() {
    this.context = {};
    this.metrics = new Map();
  }

  /**
   * Set global context (service info, environment, etc.)
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create structured log entry
   */
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
      hostname: require('os').hostname(),
      pid: process.pid
    };

    // In production: send to Datadog/CloudWatch/etc
    console.log(JSON.stringify(entry));
    
    // Track metrics
    this.trackMetric(`log.${level}`, 1);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, error, data = {}) {
    this.log('ERROR', message, {
      ...data,
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      }
    });
  }

  debug(message, data) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Track query execution with full context
   */
  logQuery(queryData) {
    this.log('INFO', 'Query executed', {
      type: 'query_execution',
      userId: queryData.userId,
      intent: queryData.intent,
      success: queryData.success,
      durationMs: queryData.durationMs,
      method: queryData.method,
      confidence: queryData.confidence,
      cacheHit: queryData.cacheHit,
      salesforceApiCalls: queryData.salesforceApiCalls
    });

    // Metrics
    this.trackMetric('query.total', 1);
    this.trackMetric(`query.intent.${queryData.intent}`, 1);
    this.trackMetric('query.duration_ms', queryData.durationMs);
    if (queryData.success) {
      this.trackMetric('query.success', 1);
    } else {
      this.trackMetric('query.failure', 1);
    }
  }

  /**
   * Track metrics (in production: send to Prometheus/Datadog)
   */
  trackMetric(name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { count: 0, sum: 0, min: Infinity, max: -Infinity, tags: [] });
    }
    
    const metric = this.metrics.get(name);
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.tags.push(tags);
  }

  /**
   * Get metrics snapshot
   */
  getMetrics() {
    const snapshot = {};
    this.metrics.forEach((value, key) => {
      snapshot[key] = {
        count: value.count,
        sum: value.sum,
        min: value.min,
        max: value.max,
        avg: value.sum / value.count
      };
    });
    return snapshot;
  }

  /**
   * Health check
   */
  healthCheck() {
    const metrics = this.getMetrics();
    const successRate = metrics['query.success']?.count / metrics['query.total']?.count || 0;
    const avgDuration = metrics['query.duration_ms']?.avg || 0;
    
    return {
      status: successRate > 0.9 && avgDuration < 3000 ? 'healthy' : 'degraded',
      metrics: {
        successRate: (successRate * 100).toFixed(1) + '%',
        avgResponseTime: Math.round(avgDuration) + 'ms',
        totalQueries: metrics['query.total']?.count || 0,
        errors: metrics['query.failure']?.count || 0
      }
    };
  }
}

const logger = new StructuredLogger();
logger.setContext({
  service: 'gtm-brain',
  version: '2.0',
  environment: process.env.NODE_ENV || 'development'
});

module.exports = logger;

