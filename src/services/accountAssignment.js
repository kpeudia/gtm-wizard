const { query } = require('../salesforce/connection');
const logger = require('../utils/logger');

/**
 * Business Lead Assignment Logic
 * Handles geographic-based assignment and workload balancing
 */

// Business Lead Mapping
const BL_ASSIGNMENTS = {
  westCoast: ['Himanshu Agarwal', 'Julie Stefanich', 'Justin'], // Justin placeholder - verify name
  eastCoast: ['Olivia Jung'],
  international: ['Johnson', 'Hannah'] // Verify actual names
};

// Geographic Regions
const WEST_COAST_STATES = ['CA', 'OR', 'WA', 'NV', 'AZ', 'ID', 'MT', 'WY', 'CO', 'UT', 'NM', 'AK', 'HI'];
const EAST_COAST_STATES = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL'];
const CENTRAL_STATES = ['ND', 'SD', 'NE', 'KS', 'OK', 'TX', 'MN', 'IA', 'MO', 'AR', 'LA', 'WI', 'IL', 'IN', 'MI', 'OH', 'KY', 'TN', 'MS', 'AL'];

// All BLs for reference (keep in sync with COMPLETE_PROJECT_HANDOFF.md)
const ALL_BUSINESS_LEADS = [
  'Julie Stefanich',
  'Himanshu Agarwal',
  'Asad Hussain',
  'Ananth Cherukupally',
  'David Van Ryk',
  'John Cobb',
  'Jon Cobb',
  'Olivia Jung'
];

/**
 * Determine region from headquarters location
 */
function determineRegion(headquarters) {
  if (!headquarters) return 'unknown';
  
  const state = headquarters.state?.toUpperCase();
  const country = headquarters.country?.toUpperCase();
  
  // International (non-USA)
  if (country && country !== 'USA' && country !== 'US' && country !== 'UNITED STATES') {
    return 'international';
  }
  
  // USA regions
  if (state) {
    if (WEST_COAST_STATES.includes(state)) {
      return 'westCoast';
    }
    if (EAST_COAST_STATES.includes(state)) {
      return 'eastCoast';
    }
    if (CENTRAL_STATES.includes(state)) {
      // Default central to west coast for now (adjust based on business rules)
      return 'westCoast';
    }
  }
  
  // Default if can't determine
  return 'westCoast';
}

/**
 * Get Business Leads for a region
 */
function getBusinessLeadsForRegion(region) {
  return BL_ASSIGNMENTS[region] || BL_ASSIGNMENTS.westCoast;
}

/**
 * Query current workload for all BLs
 */
async function assessWorkload(businessLeads) {
  try {
    // Build list of BL names for query
    const blNames = businessLeads.map(bl => `'${bl}'`).join(',');
    
    // Primary check: Count of Stage 1+ active opportunities
    const activeOppsQuery = `
      SELECT Owner.Name, COUNT(Id) OpportunityCount
      FROM Opportunity
      WHERE StageName IN ('Stage 1 - Discovery', 'Stage 2 - SQO', 'Stage 3 - Pilot', 'Stage 4 - Proposal')
        AND IsClosed = false
        AND Owner.Name IN (${blNames})
      GROUP BY Owner.Name
    `;
    
    const activeResult = await query(activeOppsQuery, false);
    
    // Secondary check: Opportunities closing this month
    const closingQuery = `
      SELECT Owner.Name, COUNT(Id) ClosingThisMonth
      FROM Opportunity
      WHERE CloseDate = THIS_MONTH
        AND IsClosed = false
        AND Owner.Name IN (${blNames})
      GROUP BY Owner.Name
    `;
    
    const closingResult = await query(closingQuery, false);
    
    // Build workload map
    const workloadMap = {};
    
    // Initialize all BLs with zero counts
    businessLeads.forEach(bl => {
      workloadMap[bl] = {
        name: bl,
        activeOpportunities: 0,
        closingThisMonth: 0,
        totalScore: 0
      };
    });
    
    // Add active opportunity counts
    if (activeResult && activeResult.records) {
      activeResult.records.forEach(record => {
        const blName = record.Owner?.Name;
        if (blName && workloadMap[blName]) {
          workloadMap[blName].activeOpportunities = record.OpportunityCount || 0;
        }
      });
    }
    
    // Add closing this month counts
    if (closingResult && closingResult.records) {
      closingResult.records.forEach(record => {
        const blName = record.Owner?.Name;
        if (blName && workloadMap[blName]) {
          workloadMap[blName].closingThisMonth = record.ClosingThisMonth || 0;
        }
      });
    }
    
    // Calculate total score (weighted: active opps are primary factor)
    Object.values(workloadMap).forEach(bl => {
      bl.totalScore = (bl.activeOpportunities * 3) + bl.closingThisMonth;
    });
    
    logger.info('Workload assessment complete:', workloadMap);
    
    return workloadMap;
    
  } catch (error) {
    logger.error('Workload assessment failed:', error);
    throw error;
  }
}

/**
 * Select best BL based on workload
 */
function selectBusinessLead(workloadMap) {
  const blList = Object.values(workloadMap);
  
  if (blList.length === 0) {
    return null;
  }
  
  // Sort by:
  // 1. Lowest active opportunities (primary)
  // 2. Lowest closing this month (secondary)
  // 3. Alphabetically (tie-breaker)
  blList.sort((a, b) => {
    if (a.activeOpportunities !== b.activeOpportunities) {
      return a.activeOpportunities - b.activeOpportunities;
    }
    if (a.closingThisMonth !== b.closingThisMonth) {
      return a.closingThisMonth - b.closingThisMonth;
    }
    return a.name.localeCompare(b.name);
  });
  
  return blList[0];
}

/**
 * Main function: Determine BL assignment for a new account
 */
async function determineAccountAssignment(headquarters) {
  try {
    // Determine region
    const region = determineRegion(headquarters);
    logger.info(`Region determined: ${region}`, headquarters);
    
    // Get BLs for region
    const businessLeads = getBusinessLeadsForRegion(region);
    logger.info(`Business leads for ${region}:`, businessLeads);
    
    // Assess current workload
    const workloadMap = await assessWorkload(businessLeads);
    
    // Select BL with lowest workload
    const selectedBL = selectBusinessLead(workloadMap);
    
    if (!selectedBL) {
      throw new Error('No business lead could be selected');
    }
    
    return {
      assignedTo: selectedBL.name,
      region,
      reasoning: {
        hqLocation: `${headquarters.city || 'Unknown'}, ${headquarters.state || headquarters.country}`,
        region,
        activeOpportunities: selectedBL.activeOpportunities,
        closingThisMonth: selectedBL.closingThisMonth,
        totalScore: selectedBL.totalScore,
        allOptions: workloadMap
      }
    };
    
  } catch (error) {
    logger.error('Account assignment determination failed:', error);
    throw error;
  }
}

/**
 * Validate BL name (for manual assignments)
 */
function validateBusinessLead(blName) {
  // Fuzzy matching for BL names
  const normalized = blName.toLowerCase().trim();
  
  for (const bl of ALL_BUSINESS_LEADS) {
    if (bl.toLowerCase().includes(normalized) || normalized.includes(bl.toLowerCase())) {
      return bl; // Return exact Salesforce name
    }
  }
  
  return null;
}

module.exports = {
  determineRegion,
  getBusinessLeadsForRegion,
  assessWorkload,
  selectBusinessLead,
  determineAccountAssignment,
  validateBusinessLead,
  ALL_BUSINESS_LEADS,
  BL_ASSIGNMENTS,
  WEST_COAST_STATES,
  EAST_COAST_STATES,
  CENTRAL_STATES
};

