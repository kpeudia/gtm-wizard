const logger = require('../utils/logger');

class SocratesAdapter {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY; // Your Socrates API key
    
    // Working Socrates configuration (discovered through testing)
    this.workingConfig = {
      baseURL: 'https://socrates.cicerotech.link',
      endpoint: '/api/chat/completions',
      authMethod: 'Bearer'
    };
    
    // Available models in your Socrates system (confirmed working)
    this.availableModels = {
      'gpt-4': 'gpt-4',
      'claude-opus-4.1': 'gpt-4', // Fallback to working model
      'claude-opus': 'gpt-4',     // Fallback to working model
      'gpt-4.0': 'gpt-4',
      'gpt-5': 'gpt-4'            // Fallback until we test gpt-5
    };
    
    this.model = this.availableModels[process.env.SOCRATES_MODEL] || 'gpt-4';
    this.workingEndpoint = null; // Cache successful endpoint
  }

  /**
   * Make a request to Socrates API
   */
  async makeRequest(messages, options = {}) {
    const startTime = Date.now();
    
    try {
      // Try different possible API formats for your internal system
      const requestBody = {
        model: options.model || this.model,
        messages: messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 2000,
        ...options
      };

      // Use the confirmed working configuration first
      try {
        const response = await this.tryWorkingConfig(requestBody);
        if (response) {
          const duration = Date.now() - startTime;
          logger.aiRequest(JSON.stringify(messages), response.usage?.total_tokens || 0, duration);
          return response;
        }
      } catch (error) {
        logger.debug('Working config failed, trying alternatives:', error.message);
      }

      // Fallback to trying alternative endpoints (shouldn't be needed)
      const possibleBaseURLs = ['https://socrates.cicerotech.link'];
      const possibleEndpoints = ['/api/chat/completions'];

      let lastError = null;

      // Try all combinations of base URLs and endpoints
      for (const baseURL of possibleBaseURLs) {
        for (const endpoint of possibleEndpoints) {
          try {
            const response = await this.tryEndpoint(baseURL, endpoint, requestBody);
            if (response) {
              // Cache the working endpoint for future requests
              this.workingEndpoint = { baseURL, endpoint };
              const duration = Date.now() - startTime;
              logger.aiRequest(JSON.stringify(messages), response.usage?.total_tokens || 0, duration);
              logger.info(`✅ Socrates API working at ${baseURL}${endpoint}`);
              return response;
            }
          } catch (error) {
            lastError = error;
            logger.debug(`Endpoint ${baseURL}${endpoint} failed:`, error.message);
          }
        }
      }

      // If all endpoints fail, throw the last error
      throw lastError || new Error('All Socrates endpoints failed');

    } catch (error) {
      logger.error('Socrates API request failed:', error);
      throw error;
    }
  }

  /**
   * Try the confirmed working configuration
   */
  async tryWorkingConfig(requestBody) {
    const url = `${this.workingConfig.baseURL}${this.workingConfig.endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'GTM-Brain-Bot/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        return this.normalizeResponse(data);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Try a specific endpoint with the request
   */
  async tryEndpoint(baseURL, endpoint, requestBody) {
    const url = `${baseURL}${endpoint}`;
    
    // Try different authentication methods
    const authMethods = [
      // Method 1: Bearer token
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'GTM-Brain-Bot/1.0'
      },
      // Method 2: API Key header
      {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'User-Agent': 'GTM-Brain-Bot/1.0'
      },
      // Method 3: Direct API key in Authorization
      {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'User-Agent': 'GTM-Brain-Bot/1.0'
      },
      // Method 4: No authentication (for testing)
      {
        'Content-Type': 'application/json',
        'User-Agent': 'GTM-Brain-Bot/1.0'
      }
    ];

    let lastError = null;

    for (const headers of authMethods) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          return this.normalizeResponse(data);
        } else {
          // Log non-200 responses for debugging
          const errorText = await response.text();
          logger.debug(`HTTP ${response.status} from ${url}: ${errorText}`);
        }
      } catch (error) {
        lastError = error;
      }
    }

    // If all auth methods fail, throw the last error
    throw lastError || new Error(`All authentication methods failed for ${url}`);
  }

  /**
   * Normalize different response formats to OpenAI-compatible format
   */
  normalizeResponse(data) {
    // Handle OpenAI-compatible format
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data;
    }

    // Handle Claude-style format
    if (data.content) {
      return {
        choices: [{
          message: {
            content: typeof data.content === 'string' ? data.content : data.content[0]?.text || ''
          }
        }],
        usage: data.usage || { total_tokens: 0 }
      };
    }

    // Handle simple text response
    if (typeof data === 'string') {
      return {
        choices: [{
          message: {
            content: data
          }
        }],
        usage: { total_tokens: 0 }
      };
    }

    // Handle response with 'text' field
    if (data.text) {
      return {
        choices: [{
          message: {
            content: data.text
          }
        }],
        usage: data.usage || { total_tokens: 0 }
      };
    }

    // Handle response with 'response' field
    if (data.response) {
      return {
        choices: [{
          message: {
            content: data.response
          }
        }],
        usage: data.usage || { total_tokens: 0 }
      };
    }

    logger.warn('Unknown Socrates response format:', data);
    throw new Error('Unable to parse Socrates response format');
  }

  /**
   * Create chat completion (OpenAI-compatible interface)
   */
  async createChatCompletion(options) {
    const { messages, ...otherOptions } = options;
    return await this.makeRequest(messages, otherOptions);
  }

  /**
   * Test connection to Socrates
   */
  async testConnection() {
    try {
      const response = await this.createChatCompletion({
        messages: [{ role: 'user', content: 'Hello, this is a connection test.' }],
        max_tokens: 10
      });

      return response.choices && response.choices[0] && response.choices[0].message;
    } catch (error) {
      logger.error('Socrates connection test failed:', error);
      return false;
    }
  }
}

/**
 * Fallback to simple HTTP requests if fetch isn't available
 */
async function makeHttpRequest(url, options) {
  if (typeof fetch !== 'undefined') {
    return fetch(url, options);
  }

  // Fallback to node-fetch or axios if needed
  try {
    const fetch = require('node-fetch');
    return fetch(url, options);
  } catch {
    const axios = require('axios');
    const response = await axios({
      url,
      method: options.method,
      headers: options.headers,
      data: options.body
    });
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data))
    };
  }
}

// Export singleton instance
const socratesAdapter = new SocratesAdapter();

module.exports = {
  SocratesAdapter,
  socratesAdapter
};
