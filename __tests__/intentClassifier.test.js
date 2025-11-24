/**
 * Tests for ML Intent Classifier
 */

const IntentClassifier = require('../src/ml/intentClassifier');

describe('IntentClassifier', () => {
  describe('predict', () => {
    test('predicts account_ownership for owner queries', () => {
      const result = IntentClassifier.predict('who owns boeing');
      expect(result.intent).toBe('account_ownership');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('predicts late_stage_pipeline for stage queries', () => {
      const result = IntentClassifier.predict('show me late stage deals');
      expect(result.intent).toBe('late_stage_pipeline');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    test('provides alternatives with confidence scores', () => {
      const result = IntentClassifier.predict('who owns intel');
      expect(result.alternatives).toBeInstanceOf(Array);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.alternatives[0].confidence).toBeLessThan(result.confidence);
    });

    test('includes model metadata in response', () => {
      const result = IntentClassifier.predict('test query');
      expect(result.method).toBe('neural_network');
      expect(result.modelVersion).toBeDefined();
    });
  });

  describe('queryToVector', () => {
    test('converts query to normalized vector', () => {
      const vector = IntentClassifier.queryToVector('test query');
      expect(vector).toBeInstanceOf(Array);
      expect(vector.length).toBe(IntentClassifier.vocabulary.size);
      
      // Check normalization
      const sum = vector.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    test('handles empty queries', () => {
      const vector = IntentClassifier.queryToVector('');
      expect(vector).toBeInstanceOf(Array);
      expect(vector.every(v => v === 0)).toBe(true);
    });
  });

  describe('getModelInfo', () => {
    test('returns comprehensive model metadata', () => {
      const info = IntentClassifier.getModelInfo();
      expect(info.type).toBe('feedforward_neural_network');
      expect(info.architecture).toHaveProperty('inputSize');
      expect(info.architecture).toHaveProperty('hiddenSize');
      expect(info.architecture).toHaveProperty('outputSize');
      expect(info.trainingHistory).toBeInstanceOf(Array);
      expect(info.trainingHistory.length).toBeGreaterThan(0);
    });

    test('includes training performance metrics', () => {
      const info = IntentClassifier.getModelInfo();
      expect(info.performance).toHaveProperty('finalAccuracy');
      expect(info.performance).toHaveProperty('finalLoss');
      expect(info.performance.finalAccuracy).toBeGreaterThan(70); // >70% accuracy
    });
  });

  describe('neural network architecture', () => {
    test('has initialized weights and biases', () => {
      expect(IntentClassifier.weights1).toBeDefined();
      expect(IntentClassifier.bias1).toBeDefined();
      expect(IntentClassifier.weights2).toBeDefined();
      expect(IntentClassifier.bias2).toBeDefined();
    });

    test('hidden layer has correct dimensions', () => {
      expect(IntentClassifier.weights1.length).toBe(128);
      expect(IntentClassifier.bias1.length).toBe(128);
    });

    test('output layer matches number of intents', () => {
      const numIntents = IntentClassifier.intentToIndex.size;
      expect(IntentClassifier.weights2.length).toBe(numIntents);
      expect(IntentClassifier.bias2.length).toBe(numIntents);
    });
  });
});

