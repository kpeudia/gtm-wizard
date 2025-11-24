/**
 * Tests for Usage Analytics & ROI Tracker
 */

const { UsageTracker } = require('../src/analytics/usageTracker');

describe('UsageTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  afterEach(() => {
    tracker.cleanup();
  });

  describe('trackQuery', () => {
    test('records successful query execution', () => {
      tracker.trackQuery({
        userId: 'U123',
        query: 'who owns intel',
        intent: 'account_ownership',
        success: true,
        responseTime: 250
      });

      expect(tracker.metrics.queryCount).toBe(1);
      expect(tracker.metrics.successes).toBe(1);
      expect(tracker.metrics.failures).toBe(0);
    });

    test('records failed query execution', () => {
      tracker.trackQuery({
        userId: 'U123',
        query: 'invalid query',
        intent: 'unknown',
        success: false,
        responseTime: 100,
        error: new Error('Query failed')
      });

      expect(tracker.metrics.failures).toBe(1);
      expect(tracker.metrics.errorTypes.size).toBeGreaterThan(0);
    });

    test('tracks user engagement metrics', () => {
      tracker.trackQuery({
        userId: 'U123',
        query: 'who owns intel',
        intent: 'account_ownership',
        success: true,
        responseTime: 250
      });

      expect(tracker.metrics.userEngagement.has('U123')).toBe(true);
      const userStats = tracker.metrics.userEngagement.get('U123');
      expect(userStats.queryCount).toBe(1);
      expect(userStats.avgResponseTime).toBe(250);
    });

    test('tracks intent distribution', () => {
      tracker.trackQuery({
        userId: 'U123',
        query: 'who owns intel',
        intent: 'account_ownership',
        success: true,
        responseTime: 250
      });

      expect(tracker.metrics.intentDistribution.get('account_ownership')).toBe(1);
    });

    test('maintains time series data by hour', () => {
      tracker.trackQuery({
        userId: 'U123',
        query: 'test',
        intent: 'test_intent',
        success: true,
        responseTime: 200
      });

      expect(tracker.metrics.timeSeriesByHour.size).toBeGreaterThan(0);
    });
  });

  describe('calculateROI', () => {
    beforeEach(() => {
      // Add sample data
      for (let i = 0; i < 100; i++) {
        tracker.trackQuery({
          userId: 'U' + i,
          query: 'test query ' + i,
          intent: 'account_ownership',
          success: true,
          responseTime: 250
        });
      }
    });

    test('calculates success rate correctly', () => {
      const roi = tracker.calculateROI();
      expect(roi.successRate).toBe('100.0%');
    });

    test('calculates time savings', () => {
      const roi = tracker.calculateROI();
      expect(roi.totalTimeSaved).toContain('hours');
      expect(roi.timeSavedPerQuery).toContain('seconds');
    });

    test('calculates money saved based on hourly rate', () => {
      const roi = tracker.calculateROI();
      expect(roi.totalMoneySaved).toContain('$');
      expect(roi.annualizedROI).toContain('$');
      expect(roi.annualizedROI).toContain('/year');
    });

    test('tracks active users and queries per user', () => {
      const roi = tracker.calculateROI();
      expect(roi.activeUsers).toBeGreaterThan(0);
      expect(roi.queriesPerActiveUser).toBeDefined();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      tracker.trackQuery({
        userId: 'U1',
        query: 'who owns intel',
        intent: 'account_ownership',
        success: true,
        responseTime: 250
      });
      tracker.trackQuery({
        userId: 'U2',
        query: 'late stage pipeline',
        intent: 'late_stage_pipeline',
        success: true,
        responseTime: 300
      });
    });

    test('returns comprehensive statistics', () => {
      const stats = tracker.getStats();
      expect(stats).toHaveProperty('roi');
      expect(stats).toHaveProperty('topIntents');
      expect(stats).toHaveProperty('topUsers');
      expect(stats).toHaveProperty('healthScore');
    });

    test('calculates top intents with percentages', () => {
      const stats = tracker.getStats();
      expect(stats.topIntents).toBeInstanceOf(Array);
      expect(stats.topIntents[0]).toHaveProperty('intent');
      expect(stats.topIntents[0]).toHaveProperty('count');
      expect(stats.topIntents[0]).toHaveProperty('percentage');
    });

    test('ranks top users by query count', () => {
      const stats = tracker.getStats();
      expect(stats.topUsers).toBeInstanceOf(Array);
      if (stats.topUsers.length > 0) {
        expect(stats.topUsers[0]).toHaveProperty('userId');
        expect(stats.topUsers[0]).toHaveProperty('queries');
      }
    });
  });

  describe('calculateHealthScore', () => {
    test('returns score between 0 and 100', () => {
      tracker.trackQuery({
        userId: 'U1',
        query: 'test',
        intent: 'test',
        success: true,
        responseTime: 200
      });

      const score = tracker.calculateHealthScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('higher success rate increases health score', () => {
      // All successful
      for (let i = 0; i < 10; i++) {
        tracker.trackQuery({
          userId: 'U1',
          query: 'test',
          intent: 'test',
          success: true,
          responseTime: 200
        });
      }
      const highScore = tracker.calculateHealthScore();

      // Create new tracker with failures
      const tracker2 = new UsageTracker();
      for (let i = 0; i < 10; i++) {
        tracker2.trackQuery({
          userId: 'U1',
          query: 'test',
          intent: 'test',
          success: i < 5, // 50% success rate
          responseTime: 200,
          error: i >= 5 ? new Error('Failed') : null
        });
      }
      const lowScore = tracker2.calculateHealthScore();

      expect(highScore).toBeGreaterThan(lowScore);
      tracker2.cleanup();
    });
  });

  describe('exportMetrics', () => {
    test('exports metrics in structured format', () => {
      tracker.trackQuery({
        userId: 'U1',
        query: 'test',
        intent: 'test',
        success: true,
        responseTime: 200
      });

      const exported = tracker.exportMetrics();
      expect(exported).toHaveProperty('summary');
      expect(exported).toHaveProperty('rawMetrics');
      expect(exported.rawMetrics).toHaveProperty('queries');
      expect(exported.rawMetrics).toHaveProperty('intentDistribution');
      expect(exported.rawMetrics).toHaveProperty('userEngagement');
    });
  });
});

