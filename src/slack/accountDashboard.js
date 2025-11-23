const { query } = require('../salesforce/connection');
const { cleanStageName } = require('../utils/formatters');

/**
 * Generate Account Status Dashboard - Mobile-optimized with tabs
 * Matches v0 interview dashboard quality
 */
async function generateAccountDashboard() {
  // Use SAME logic as weighted pipeline query (from events.js)
  const pipelineQuery = `SELECT StageName,
                                SUM(ACV__c) GrossAmount,
                                SUM(Finance_Weighted_ACV__c) WeightedAmount,
                                COUNT(Id) DealCount
                         FROM Opportunity
                         WHERE IsClosed = false 
                           AND StageName IN ('Stage 1 - Discovery', 'Stage 2 - SQO', 'Stage 3 - Pilot', 'Stage 4 - Proposal')
                         GROUP BY StageName`;
  
  const pipelineData = await query(pipelineQuery, true);
  
  // Calculate totals (REAL data, not mock)
  let totalGross = 0;
  let totalWeighted = 0;
  let totalDeals = 0;
  
  pipelineData.records.forEach(r => {
    totalGross += r.GrossAmount || 0;
    totalWeighted += r.WeightedAmount || 0;
    totalDeals += r.DealCount || 0;
  });
  
  const avgDealSize = totalDeals > 0 ? totalGross / totalDeals : 0;
  
  // Query accounts with opportunities
  const accountQuery = `SELECT Account.Name, Account.Owner.Name, Account.Is_New_Logo__c,
                               Account.Account_Plan_s__c,
                               Name, StageName, ACV__c, Product_Line__c
                        FROM Opportunity
                        WHERE IsClosed = false
                          AND StageName IN ('Stage 1 - Discovery', 'Stage 2 - SQO', 'Stage 3 - Pilot', 'Stage 4 - Proposal')
                        ORDER BY StageName DESC, Account.Name`;
  
  const accountData = await query(accountQuery, true);
  
  // Group by account
  const accountMap = new Map();
  let newLogoCount = 0;
  
  accountData.records.forEach(opp => {
    const accountName = opp.Account?.Name;
    
    if (!accountMap.has(accountName)) {
      accountMap.set(accountName, {
        name: accountName,
        owner: opp.Account?.Owner?.Name,
        isNewLogo: opp.Account?.Is_New_Logo__c,
        hasAccountPlan: !!opp.Account?.Account_Plan_s__c,
        opportunities: [],
        highestStage: 0
      });
      if (opp.Account?.Is_New_Logo__c) newLogoCount++;
    }
    
    const account = accountMap.get(accountName);
    account.opportunities.push(opp);
    
    const stageNum = parseInt(opp.StageName.match(/Stage (\d)/)?.[1] || 0);
    account.highestStage = Math.max(account.highestStage, stageNum);
  });
  
  // Categorize by stage
  const late = [], mid = [], early = [];
  accountMap.forEach(acc => {
    if (acc.highestStage >= 3) late.push(acc);
    else if (acc.highestStage === 2) mid.push(acc);
    else early.push(acc);
  });
  
  // Count accounts with/without plans
  const accountsWithPlans = Array.from(accountMap.values()).filter(a => a.hasAccountPlan).length;
  const accountsWithoutPlans = accountMap.size - accountsWithPlans;
  
  // Generate mobile-optimized tabbed HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Account Status Dashboard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fe; padding: 16px; }
.header { background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
.header h1 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
.header p { font-size: 0.875rem; color: #6b7280; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; }
.tab { background: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; white-space: nowrap; color: #6b7280; }
.tab.active { background: #8e99e1; color: #fff; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
.metric { background: #fff; padding: 16px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.metric-label { font-size: 0.75rem; color: #6b7280; font-weight: 500; margin-bottom: 4px; }
.metric-value { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 2px; }
.metric-change { font-size: 0.75rem; font-weight: 500; }
.up { color: #10b981; }
.down { color: #ef4444; }
.stage-section { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
.stage-title { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.stage-subtitle { font-size: 0.875rem; color: #6b7280; margin-bottom: 16px; }
.account-list { display: flex; flex-direction: column; gap: 8px; }
.account-item { font-size: 0.875rem; color: #374151; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.account-item:last-child { border-bottom: none; }
.account-name { font-weight: 600; color: #1f2937; }
.account-owner { color: #6b7280; font-size: 0.8125rem; margin-top: 2px; }
.account-card { background: #fafafa; border-left: 4px solid #8e99e1; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
.card-late { border-left-color: #10b981; }
.card-mid { border-left-color: #3b82f6; }
.card-early { border-left-color: #f59e0b; }
.opp-pill { display: inline-block; background: #8e99e1; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; margin: 4px 4px 0 0; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 600; margin-left: 6px; }
.badge-new { background: #d1fae5; color: #065f46; }
.plan-status { margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 6px; }
.plan-stat { display: inline-block; margin-right: 20px; }
.plan-stat-value { font-weight: 700; font-size: 1.25rem; color: #1f2937; }
.plan-stat-label { font-size: 0.75rem; color: #6b7280; }
@media (min-width: 640px) { .metrics { grid-template-columns: repeat(4, 1fr); } }
</style>
</head>
<body>

<div class="header">
  <h1>Account Status Dashboard</h1>
  <p>Real-time pipeline overview • Updated ${new Date().toLocaleTimeString()}</p>
</div>

<div class="tabs">
  <button class="tab active" onclick="showTab('summary')">Summary</button>
  <button class="tab" onclick="showTab('by-stage')">By Stage</button>
  <button class="tab" onclick="showTab('account-plans')">Account Plans</button>
</div>

<!-- TAB 1: SUMMARY -->
<div id="summary" class="tab-content active">
  <div class="metrics">
    <div class="metric">
      <div class="metric-label">Total Pipeline</div>
      <div class="metric-value">$${(totalGross / 1000000).toFixed(1)}M</div>
    </div>
    <div class="metric">
      <div class="metric-label">Weighted</div>
      <div class="metric-value">$${(totalWeighted / 1000000).toFixed(1)}M</div>
    </div>
    <div class="metric">
      <div class="metric-label">Accounts</div>
      <div class="metric-value">${accountMap.size}</div>
      <div class="metric-change">${newLogoCount} new</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg Deal</div>
      <div class="metric-value">$${(avgDealSize / 1000).toFixed(0)}K</div>
    </div>
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Late Stage (${late.length})</div>
    <div class="account-list">
      ${late.slice(0, 5).map(acc => `
        <div class="account-item">
          <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
          <div class="account-owner">${acc.owner} • ${acc.opportunities.length} opp${acc.opportunities.length > 1 ? 's' : ''}</div>
        </div>
      `).join('')}
      ${late.length > 5 ? `<div class="account-item" style="color: #6b7280;">+${late.length - 5} more...</div>` : ''}
    </div>
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Mid Stage (${mid.length})</div>
    <div class="account-list">
      ${mid.slice(0, 5).map(acc => `
        <div class="account-item">
          <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
          <div class="account-owner">${acc.owner}</div>
        </div>
      `).join('')}
      ${mid.length > 5 ? `<div class="account-item" style="color: #6b7280;">+${mid.length - 5} more...</div>` : ''}
    </div>
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Early Stage (${early.length})</div>
    <div class="account-list">
      ${early.slice(0, 5).map(acc => `
        <div class="account-item">
          <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
          <div class="account-owner">${acc.owner}</div>
        </div>
      `).join('')}
      ${early.length > 5 ? `<div class="account-item" style="color: #6b7280;">+${early.length - 5} more...</div>` : ''}
    </div>
  </div>
</div>

<!-- TAB 2: BY STAGE -->
<div id="by-stage" class="tab-content">
  <div class="stage-section">
    <div class="stage-title">Late Stage (${late.length})</div>
    <div class="stage-subtitle">Pilot & Proposal</div>
    ${late.map(acc => `
      <div class="account-card card-late">
        <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
        <div class="account-owner" style="margin-bottom: 8px;">${acc.owner}</div>
        <div>${acc.opportunities.map(o => `<span class="opp-pill">${cleanStageName(o.StageName)} • ${o.Product_Line__c || 'TBD'} • $${((o.ACV__c || 0) / 1000).toFixed(0)}K</span>`).join('')}</div>
      </div>
    `).join('')}
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Mid Stage (${mid.length})</div>
    <div class="stage-subtitle">SQO</div>
    ${mid.map(acc => `
      <div class="account-card card-mid">
        <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
        <div class="account-owner" style="margin-bottom: 8px;">${acc.owner}</div>
        <div>${acc.opportunities.map(o => `<span class="opp-pill">${o.Product_Line__c || 'TBD'} • $${((o.ACV__c || 0) / 1000).toFixed(0)}K</span>`).join('')}</div>
      </div>
    `).join('')}
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Early Stage (${early.length})</div>
    <div class="stage-subtitle">Discovery</div>
    ${early.map(acc => `
      <div class="account-card card-early">
        <div class="account-name">${acc.name}${acc.isNewLogo ? '<span class="badge badge-new">New</span>' : ''}</div>
        <div class="account-owner" style="margin-bottom: 8px;">${acc.owner}</div>
        <div>${acc.opportunities.map(o => `<span class="opp-pill">${o.Product_Line__c || 'TBD'} • $${((o.ACV__c || 0) / 1000).toFixed(0)}K</span>`).join('')}</div>
      </div>
    `).join('')}
  </div>
</div>

<!-- TAB 3: ACCOUNT PLANS -->
<div id="account-plans" class="tab-content">
  <div class="plan-status">
    <div class="plan-stat">
      <div class="plan-stat-value">${accountsWithPlans}</div>
      <div class="plan-stat-label">With Account Plans</div>
    </div>
    <div class="plan-stat">
      <div class="plan-stat-value">${accountsWithoutPlans}</div>
      <div class="plan-stat-label">Missing Plans</div>
    </div>
  </div>
  
  <div class="stage-section">
    <div class="stage-title">Accounts with Plans (${accountsWithPlans})</div>
    ${Array.from(accountMap.values()).filter(a => a.hasAccountPlan).map(acc => `
      <div class="account-item">
        <div class="account-name">${acc.name}</div>
        <div class="account-owner">${acc.owner} • Stage ${acc.highestStage}</div>
      </div>
    `).join('')}
  </div>
  
  ${accountsWithoutPlans > 0 ? `
  <div class="stage-section" style="border-left: 3px solid #ef4444;">
    <div class="stage-title">Missing Account Plans (${accountsWithoutPlans})</div>
    <div class="stage-subtitle">Required for Stage 2+</div>
    ${Array.from(accountMap.values()).filter(a => !a.hasAccountPlan && a.highestStage >= 2).map(acc => `
      <div class="account-item" style="background: #fef2f2; padding: 8px; border-radius: 4px; margin-bottom: 6px;">
        <div class="account-name">${acc.name}</div>
        <div class="account-owner">${acc.owner} • Stage ${acc.highestStage} ⚠️ Plan Required</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
</div>

<script>
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}
</script>

</body>
</html>`;
  
  return html;
}

module.exports = {
  generateAccountDashboard
};
