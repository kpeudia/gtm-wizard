const logger = require('../utils/logger');
const fetch = require('node-fetch');

/**
 * Clay API Integration for Company Enrichment
 * Enriches company data with headquarters, revenue, website, LinkedIn, employee count
 */
class ClayEnrichment {
  constructor() {
    this.apiKey = process.env.CLAY_API_KEY;
    this.baseUrl = 'https://api.clay.com/v1';
    this.enabled = !!this.apiKey;
  }

  /**
   * Enrich company data using Clay API
   */
  async enrichCompanyData(companyName) {
    // ALWAYS check for test companies first (even if API key is set)
    const companyLower = companyName.toLowerCase();
    
    // MOCK ENRICHMENT for any test/demo company (until real Clay API)
    // This ensures testing works without Clay API key
    
    if (companyLower === 'gtm test company' || companyLower === 'gtm test') {
      logger.info('🧪 Using mock enrichment for GTM Test Company');
      return {
        companyName: 'GTM Test Company',
        headquarters: { city: 'San Francisco', state: 'CA', country: 'USA' },
        revenue: 50000000,
        website: 'www.gtmtestcompany.com',
        linkedIn: 'https://www.linkedin.com/company/gtm-test-company',
        employeeCount: 250,
        industry: 'Technology',
        success: true,
        source: 'Mock Data'
      };
    }
    
    if (companyLower === 'ikea' || companyLower.includes('ikea')) {
      logger.info('🧪 Using mock enrichment for IKEA');
      return {
        companyName: 'IKEA',
        headquarters: { city: 'Älmhult', state: null, country: 'Sweden' },
        revenue: 44600000000,
        website: 'www.ikea.com',
        linkedIn: 'https://www.linkedin.com/company/ikea',
        employeeCount: 166000,
        industry: 'Retail',
        success: true,
        source: 'Mock Data'
      };
    }
    
    if (companyLower === 'levi strauss' || companyLower.includes('levi')) {
      logger.info('🧪 Using mock enrichment for Levi Strauss');
      return {
        companyName: 'Levi Strauss', // Proper casing
        headquarters: { city: 'San Francisco', state: 'CA', country: 'USA' },
        revenue: 6200000000, // $6.2B
        website: 'www.levistrauss.com',
        linkedIn: 'https://www.linkedin.com/company/levi-strauss',
        employeeCount: 19000,
        industry: 'Retail',
        success: true,
        source: 'Mock Data'
      };
    }
    
    // For real companies - try Clay API if available
    try {
      if (!this.enabled) {
        logger.warn('⚠️  Clay API key not configured');
        return this.getEmptyEnrichment(companyName);
      }

      logger.info(`🔍 Calling Clay API for: ${companyName}`);

      // Clay enrichment endpoint (v1/companies/enrich)
      const response = await fetch(`${this.baseUrl}/companies/enrich`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: companyName // Try 'name' instead of 'company_name'
        }),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Clay API error: ${response.status} - ${errorText}`);
        
        // Try alternate request format if first fails
        logger.info('Trying alternate request format...');
        const response2 = await fetch(`${this.baseUrl}/companies/enrich`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: companyName.toLowerCase().replace(/\s+/g, '') + '.com' // Try domain format
          })
        });
        
        if (!response2.ok) {
          throw new Error(`Clay API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response2.json();
        logger.info('Clay API response (alternate format):', { hasData: !!data, keys: Object.keys(data || {}) });
        return this.parseClayResponse(data, companyName);
      }

      const data = await response.json();
      logger.info('Clay API response received:', { hasData: !!data, keys: Object.keys(data || {}) });
      
      return this.parseClayResponse(data, companyName);

      return this.parseClayResponse(data, companyName);

    } catch (error) {
      logger.error(`Clay enrichment failed for ${companyName}:`, error.message);
      
      // Return empty enrichment on failure (allow manual entry)
      return this.getEmptyEnrichment(companyName, error.message);
    }
  }

  /**
   * Parse Clay API response to our enrichment format
   */
  parseClayResponse(data, companyName) {
    logger.info('📊 Parsing Clay response:', JSON.stringify(data, null, 2));
    
    const enrichment = {
      companyName: data.name || data.company_name || companyName,
      headquarters: this.parseHeadquarters(data),
      revenue: data.revenue || data.annual_revenue || data.estimated_revenue || null,
      website: data.website || data.domain || data.url || null,
      linkedIn: data.linkedin_url || data.linkedin || data.linkedin_company_url || null,
      employeeCount: data.employee_count || data.headcount || data.employees || null,
      industry: data.industry || data.industry_category || null,
      foundedYear: data.founded_year || data.founded || null,
      success: true,
      source: 'Clay API'
    };

    logger.info(`✅ Parsed enrichment:`, {
      companyName: enrichment.companyName,
      hasWebsite: !!enrichment.website,
      hasLinkedIn: !!enrichment.linkedIn,
      hasRevenue: !!enrichment.revenue,
      hasHQ: !!enrichment.headquarters?.state || !!enrichment.headquarters?.country
    });

    return enrichment;
  }

  /**
   * Parse headquarters from Clay response
   */
  parseHeadquarters(data) {
    if (data.headquarters) {
      return {
        city: data.headquarters.city || null,
        state: data.headquarters.state || data.headquarters.region || null,
        country: data.headquarters.country || 'USA',
        fullAddress: data.headquarters.full_address || null
      };
    }

    // Try alternate formats
    if (data.hq_city || data.hq_state || data.hq_country) {
      return {
        city: data.hq_city || null,
        state: data.hq_state || null,
        country: data.hq_country || 'USA',
        fullAddress: null
      };
    }

    // Try location field
    if (data.location) {
      const parts = data.location.split(',').map(p => p.trim());
      return {
        city: parts[0] || null,
        state: parts[1] || null,
        country: parts[2] || 'USA',
        fullAddress: data.location
      };
    }

    return {
      city: null,
      state: null,
      country: null,
      fullAddress: null
    };
  }

  /**
   * Get empty enrichment object (fallback when Clay fails)
   */
  getEmptyEnrichment(companyName, errorMessage = null) {
    return {
      companyName,
      headquarters: {
        city: null,
        state: null,
        country: null,
        fullAddress: null
      },
      revenue: null,
      website: null,
      linkedIn: null,
      employeeCount: null,
      industry: null,
      foundedYear: null,
      success: false,
      source: 'Manual entry required',
      error: errorMessage
    };
  }

  /**
   * Validate enrichment has minimum required data
   */
  hasMinimumData(enrichment) {
    return !!(enrichment.headquarters?.state || enrichment.headquarters?.country);
  }
}

// Singleton instance
const clayEnrichment = new ClayEnrichment();

module.exports = {
  ClayEnrichment,
  clayEnrichment,
  enrichCompanyData: (companyName) => clayEnrichment.enrichCompanyData(companyName)
};

