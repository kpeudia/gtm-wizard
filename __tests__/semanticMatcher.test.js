/**
 * Tests for Semantic Query Matcher
 */

const SemanticMatcher = require('../src/ai/semanticMatcher');

describe('SemanticMatcher', () => {
  describe('matchQuery', () => {
    test('matches "who owns intel" to account_ownership intent', async () => {
      const result = await SemanticMatcher.matchQuery('who owns intel');
      expect(result.intent).toBe('account_ownership');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('matches similar phrasing variations', async () => {
      const variations = [
        'who is the owner of boeing',
        'account owner for microsoft',
        'who owns this company'
      ];
      
      for (const query of variations) {
        const result = await SemanticMatcher.matchQuery(query);
        expect(result.intent).toBe('account_ownership');
      }
    });

    test('matches pipeline queries with semantic understanding', async () => {
      const result = await SemanticMatcher.matchQuery('show me deals in proposal stage');
      expect(result.intent).toBe('late_stage_pipeline');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('returns unknown for unrecognized queries', async () => {
      const result = await SemanticMatcher.matchQuery('xyzabc random nonsense');
      expect(result.intent).toBe('unknown');
    });

    test('provides alternatives with confidence scores', async () => {
      const result = await SemanticMatcher.matchQuery('who owns intel');
      expect(result.alternatives).toBeInstanceOf(Array);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.alternatives[0]).toHaveProperty('intent');
      expect(result.alternatives[0]).toHaveProperty('confidence');
    });
  });

  describe('simpleTFIDFVector', () => {
    test('creates consistent vectors for same input', () => {
      const vec1 = SemanticMatcher.simpleTFIDFVector('test query');
      const vec2 = SemanticMatcher.simpleTFIDFVector('test query');
      expect(vec1).toEqual(vec2);
    });

    test('creates different vectors for different inputs', () => {
      const vec1 = SemanticMatcher.simpleTFIDFVector('test query');
      const vec2 = SemanticMatcher.simpleTFIDFVector('different words');
      expect(vec1).not.toEqual(vec2);
    });
  });

  describe('cosineSimilarity', () => {
    test('returns 1.0 for identical vectors', () => {
      const vec = [1, 2, 3, 4, 5];
      const similarity = SemanticMatcher.cosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    test('returns 0.0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0, 0];
      const vec2 = [0, 1, 0, 0];
      const similarity = SemanticMatcher.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    test('returns value between 0 and 1 for similar vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 4];
      const similarity = SemanticMatcher.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('getMetrics', () => {
    test('returns metrics object with cache info', () => {
      const metrics = SemanticMatcher.getMetrics();
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('patternCount');
      expect(metrics).toHaveProperty('threshold');
      expect(metrics.threshold).toBe(0.75);
    });
  });
});

