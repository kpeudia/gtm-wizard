const { query } = require('../salesforce/connection');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

/**
 * Generate Full Active Pipeline Excel Report
 */
async function generateFullPipelineExcel() {
  // Query: ALL active pipeline (Stages 0-4, all products)
  // Custom ORDER BY to sort Stage 4 first (descending), then by Name
  const reportQuery = `SELECT Name,
                              Product_Line__c,
                              StageName,
                              Target_LOI_Date__c,
                              ACV__c,
                              Owner.Name
                       FROM Opportunity
                       WHERE IsClosed = false
                         AND (StageName = 'Stage 0 - Qualifying'
                              OR StageName = 'Stage 1 - Discovery'
                              OR StageName = 'Stage 2 - SQO'
                              OR StageName = 'Stage 3 - Pilot'
                              OR StageName = 'Stage 4 - Proposal')
                       ORDER BY 
                         CASE 
                           WHEN StageName = 'Stage 4 - Proposal' THEN 1
                           WHEN StageName = 'Stage 3 - Pilot' THEN 2
                           WHEN StageName = 'Stage 2 - SQO' THEN 3
                           WHEN StageName = 'Stage 1 - Discovery' THEN 4
                           WHEN StageName = 'Stage 0 - Qualifying' THEN 5
                         END,
                         Name`;

  const data = await query(reportQuery, false);

  if (!data || !data.records || data.records.length === 0) {
    throw new Error('No active pipeline data found');
  }

  // Calculate stage counts
  const stage0Count = data.records.filter(r => r.StageName === 'Stage 0 - Qualifying').length;
  const stage1Count = data.records.filter(r => r.StageName === 'Stage 1 - Discovery').length;
  const stage2Count = data.records.filter(r => r.StageName === 'Stage 2 - SQO').length;
  const stage3Count = data.records.filter(r => r.StageName === 'Stage 3 - Pilot').length;
  const stage4Count = data.records.filter(r => r.StageName === 'Stage 4 - Proposal').length;

  // Create Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Active Pipeline');

  // Define columns for full pipeline
  worksheet.columns = [
    { header: 'Opportunity Name', key: 'oppName', width: 40 },
    { header: 'Product Line', key: 'productLine', width: 30 },
    { header: 'Stage', key: 'stage', width: 20 },
    { header: 'Target Sign Date', key: 'targetDate', width: 18 },
    { header: 'ACV', key: 'acv', width: 15 },
    { header: 'Owner', key: 'owner', width: 20 }
  ];

  // Header styling - BLACK background with WHITE bold text
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' }
  };
  headerRow.height = 22;
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Add data
  data.records.forEach(record => {
    worksheet.addRow({
      oppName: record.Name || '',
      productLine: record.Product_Line__c || '',
      stage: record.StageName || '',
      targetDate: record.Target_LOI_Date__c || '',
      acv: record.ACV__c || 0,
      owner: record.Owner?.Name || ''
    });
  });

  // Format currency
  worksheet.getColumn('acv').numFmt = '$#,##0';

  // Add borders
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer,
    recordCount: data.totalSize,
    stage0Count,
    stage1Count,
    stage2Count,
    stage3Count,
    stage4Count
  };
}

/**
 * Send full pipeline report to Slack
 */
async function sendFullPipelineToSlack(client, channelId, userId) {
  try {
    logger.info('Generating full active pipeline report for Slack...');

    const { buffer, recordCount, stage0Count, stage1Count, stage2Count, stage3Count, stage4Count } = await generateFullPipelineExcel();
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `Full_Active_Pipeline_${date}.xlsx`;

    // Format message
    let message = `*Full Active Pipeline Report*\n\n`;
    message += `Total Opportunities: ${recordCount}\n\n`;
    message += `Stage 0 - Qualifying: ${stage0Count}\n`;
    message += `Stage 1 - Discovery: ${stage1Count}\n`;
    message += `Stage 2 - SQO: ${stage2Count}\n`;
    message += `Stage 3 - Pilot: ${stage3Count}\n`;
    message += `Stage 4 - Proposal: ${stage4Count}\n\n`;
    message += `All active opportunities (Stages 0-4). All product lines included.`;

    // Upload to Slack
    const result = await client.files.uploadV2({
      channel_id: channelId,
      file: buffer,
      filename: filename,
      title: "Full Active Pipeline Report",
      initial_comment: message
    });

    logger.info('✅ Full pipeline report uploaded to Slack');
    return result;

  } catch (error) {
    logger.error('Failed to send full pipeline report to Slack:', error);
    throw error;
  }
}

module.exports = {
  generateFullPipelineExcel,
  sendFullPipelineToSlack
};

