const crypto = require('crypto');

/**
 * In-Memory Query Cache
 * 60-second TTL for Salesforce queries
 * Reduces API load and speeds up duplicate queries
 */

class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 60000; // 60 seconds
    this.stats = { hits: 0, misses: 0, writes: 0 };
  }

  /**
   * Get cache key from SOQL query
   */
  getCacheKey(soql) {
    return crypto.createHash('md5').update(soql).digest('hex');
  }

  /**
   * Get cached result
   */
  get(soql) {
    const key = this.getCacheKey(soql);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return cached.data;
  }

  /**
   * Set cached result
   */
  set(soql, data) {
    const key = this.getCacheKey(soql);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.stats.writes++;
  }

  /**
   * Invalidate cache by pattern
   * Used when data is updated
   */
  invalidate(pattern) {
    let count = 0;
    this.cache.forEach((value, key) => {
      // If pattern matches cached query, remove it
      if (pattern && key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    });
    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Clean expired entries (runs periodically)
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });
    
    return removed;
  }
}

// Singleton instance
const queryCache = new QueryCache();

// Cleanup expired entries every 2 minutes
setInterval(() => {
  const removed = queryCache.cleanup();
  if (removed > 0) {
    console.log(`🧹 Cleaned ${removed} expired cache entries`);
  }
}, 120000);

module.exports = {
  QueryCache,
  queryCache
};

