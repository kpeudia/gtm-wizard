const { query } = require('../salesforce/connection');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

/**
 * Generate Johnson Hana pipeline Excel
 */
async function generateJohnsonHanaExcel() {
  // Query: Stages 2, 3, 4 + Product lines: Contracting, Multiple, sigma, Insights
  const reportQuery = `SELECT Account.Name,
                              Name,
                              StageName,
                              Product_Line__c,
                              ACV__c,
                              Finance_Weighted_ACV__c,
                              Target_LOI_Date__c,
                              Owner.Name,
                              Days_in_Stage1__c
                       FROM Opportunity
                       WHERE IsClosed = false
                         AND StageName IN ('Stage 2 - SQO', 'Stage 3 - Pilot', 'Stage 4 - Proposal')
                         AND (Product_Line__c = 'AI-Augmented Contracting'
                              OR Product_Line__c = 'Multiple'
                              OR Product_Line__c = 'sigma')
                       ORDER BY StageName, Account.Name`;

  const data = await query(reportQuery, false);

  if (!data || !data.records || data.records.length === 0) {
    throw new Error('No pipeline data found for report');
  }

  // Create Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Weekly Pipeline');

  // Columns
  worksheet.columns = [
    { header: 'Account', key: 'account', width: 25 },
    { header: 'Opportunity', key: 'opp', width: 35 },
    { header: 'Stage', key: 'stage', width: 18 },
    { header: 'Product Line', key: 'product', width: 25 },
    { header: 'ACV', key: 'acv', width: 12 },
    { header: 'Weighted ACV', key: 'weighted', width: 14 },
    { header: 'Target Sign', key: 'target', width: 12 },
    { header: 'Owner', key: 'owner', width: 18 },
    { header: 'Days in Stage', key: 'days', width: 12 }
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.height = 20;

  // Add data
  data.records.forEach(record => {
    const row = worksheet.addRow({
      account: record.Account?.Name || '',
      opp: record.Name || '',
      stage: record.StageName || '',
      product: record.Product_Line__c || '',
      acv: record.ACV__c || 0,
      weighted: record.Finance_Weighted_ACV__c || 0,
      target: record.Target_LOI_Date__c || '',
      owner: record.Owner?.Name || '',
      days: record.Days_in_Stage1__c || ''
    });

    // Alternate row colors
    if (row.number % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }
  });

  // Format currency
  worksheet.getColumn('acv').numFmt = '$#,##0';
  worksheet.getColumn('weighted').numFmt = '$#,##0';

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, recordCount: data.totalSize };
}

/**
 * Send pipeline report to Slack
 */
async function sendPipelineReportToSlack(client, channelId, userId) {
  try {
    logger.info('📊 Generating pipeline report for Slack...');

    const { buffer, recordCount } = await generateJohnsonHanaExcel();
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `Eudia_Weekly_Pipeline_${date}.xlsx`;

    // Upload to Slack
    const result = await client.files.uploadV2({
      channel_id: channelId,
      file: buffer,
      filename: filename,
      title: 'Weekly Pipeline Report - Johnson Hana',
      initial_comment: `📊 *Weekly Pipeline Report*\n\nStages 2, 3, 4 | Product Lines: Contracting, Multiple, sigma\n\nTotal: ${recordCount} opportunities\n\nGenerated: ${date}`
    });

    logger.info('✅ Pipeline report uploaded to Slack');
    return result;

  } catch (error) {
    logger.error('Failed to send pipeline report to Slack:', error);
    throw error;
  }
}

module.exports = {
  generateJohnsonHanaExcel,
  sendPipelineReportToSlack
};

