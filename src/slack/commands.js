const logger = require('../utils/logger');
const { cache } = require('../utils/cache');
const { parseIntent } = require('../ai/intentParser');
const { getContext, updateContext, clearContext } = require('../ai/contextManager');
const { queryBuilder } = require('../salesforce/queries');
const { query } = require('../salesforce/connection');
const { formatResponse } = require('./responseFormatter');

/**
 * Register Slack slash commands
 */
function registerSlashCommands(app) {
  
  // Main pipeline command
  app.command('/pipeline', async ({ command, ack, respond, client }) => {
    await ack();
    
    try {
      await handlePipelineCommand(command, respond, client);
    } catch (error) {
      logger.error('Pipeline command error:', error);
      await respond('❌ Sorry, I encountered an error. Please try again.');
    }
  });

  // Forecast command
  app.command('/forecast', async ({ command, ack, respond, client }) => {
    await ack();
    
    try {
      await handleForecastCommand(command, respond, client);
    } catch (error) {
      logger.error('Forecast command error:', error);
      await respond('❌ Sorry, I encountered an error. Please try again.');
    }
  });

  // Deals command
  app.command('/deals', async ({ command, ack, respond, client }) => {
    await ack();
    
    try {
      await handleDealsCommand(command, respond, client);
    } catch (error) {
      logger.error('Deals command error:', error);
      await respond('❌ Sorry, I encountered an error. Please try again.');
    }
  });

  // Activity command
  app.command('/activity', async ({ command, ack, respond, client }) => {
    await ack();
    
    try {
      await handleActivityCommand(command, respond, client);
    } catch (error) {
      logger.error('Activity command error:', error);
      await respond('❌ Sorry, I encountered an error. Please try again.');
    }
  });

  logger.info('✅ Slash commands registered');
}

/**
 * Handle /pipeline command
 */
async function handlePipelineCommand(command, respond, client) {
  const userId = command.user_id;
  const channelId = command.channel_id;
  const text = command.text.trim();

  // Log interaction
  logger.slackInteraction('slash_command', userId, channelId, `/pipeline ${text}`);

  // Check rate limiting - Generous for testing and exploration
  const rateLimit = await cache.checkRateLimit(userId, 'slash_command');
  if (!rateLimit.allowed) {
    await respond({
      response_type: 'ephemeral',
      text: `⏱️ Whoa there! You're really testing me out. Please wait ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds before your next command. 🚀`
    });
    return;
  }

  // Handle help
  if (!text || text === 'help') {
    await respond({
      response_type: 'ephemeral',
      text: getPipelineHelp()
    });
    return;
  }

  // Handle clear context
  if (text === 'clear') {
    await clearContext(userId, channelId);
    await respond({
      response_type: 'ephemeral',
      text: '🗑️ Conversation context cleared.'
    });
    return;
  }

  // Process query
  await processSlashQuery(text, userId, channelId, 'pipeline_summary', respond);
}

/**
 * Handle /forecast command
 */
async function handleForecastCommand(command, respond, client) {
  const userId = command.user_id;
  const channelId = command.channel_id;
  const text = command.text.trim();

  logger.slackInteraction('slash_command', userId, channelId, `/forecast ${text}`);

  if (!text || text === 'help') {
    await respond({
      response_type: 'ephemeral',
      text: getForecastHelp()
    });
    return;
  }

  await processSlashQuery(text, userId, channelId, 'forecasting', respond);
}

/**
 * Handle /deals command
 */
async function handleDealsCommand(command, respond, client) {
  const userId = command.user_id;
  const channelId = command.channel_id;
  const text = command.text.trim();

  logger.slackInteraction('slash_command', userId, channelId, `/deals ${text}`);

  if (!text || text === 'help') {
    await respond({
      response_type: 'ephemeral',
      text: getDealsHelp()
    });
    return;
  }

  await processSlashQuery(text, userId, channelId, 'deal_lookup', respond);
}

/**
 * Handle /activity command
 */
async function handleActivityCommand(command, respond, client) {
  const userId = command.user_id;
  const channelId = command.channel_id;
  const text = command.text.trim();

  logger.slackInteraction('slash_command', userId, channelId, `/activity ${text}`);

  if (!text || text === 'help') {
    await respond({
      response_type: 'ephemeral',
      text: getActivityHelp()
    });
    return;
  }

  await processSlashQuery(text, userId, channelId, 'activity_check', respond);
}

/**
 * Process slash command query
 */
async function processSlashQuery(text, userId, channelId, defaultIntent, respond) {
  try {
    // Show initial response
    await respond({
      response_type: 'in_channel',
      text: `🤖 Processing: "${text}"...`
    });

    // Get conversation context
    const conversationContext = await getContext(userId, channelId);

    // Parse intent
    const parsedIntent = await parseIntent(text, conversationContext, userId);
    
    // Override intent if needed
    if (parsedIntent.intent === 'pipeline_summary' && defaultIntent !== 'pipeline_summary') {
      parsedIntent.intent = defaultIntent;
    }

    // Build and execute query
    let queryResult = null;
    let soql = null;

    if (parsedIntent.intent === 'forecasting') {
      soql = queryBuilder.buildOpportunityQuery({
        ...parsedIntent.entities,
        isClosed: false,
        forecastCategory: parsedIntent.entities.forecastCategory || ['Best Case', 'Commit', 'Pipeline']
      });
    } else if (parsedIntent.intent === 'activity_check') {
      soql = queryBuilder.buildOpportunityQuery({
        ...parsedIntent.entities,
        isClosed: false,
        staleDays: parsedIntent.entities.staleDays || 30
      });
    } else {
      soql = queryBuilder.buildOpportunityQuery(parsedIntent.entities);
    }

    queryResult = await query(soql);

    // Update context
    await updateContext(userId, channelId, parsedIntent, queryResult);

    // Format response
    const formattedResponse = formatResponse(queryResult, parsedIntent, conversationContext);

    // Send follow-up response
    await respond({
      response_type: 'in_channel',
      text: formattedResponse,
      replace_original: true
    });

  } catch (error) {
    logger.error('Slash command processing failed:', error);
    
    await respond({
      response_type: 'ephemeral',
      text: `❌ Error processing "${text}". Please try rephrasing or use the help command.`,
      replace_original: true
    });
  }
}

/**
 * Pipeline help text
 */
function getPipelineHelp() {
  return `📊 *Pipeline Command Help*

Usage: \`/pipeline [query]\`

*Examples:*
• \`/pipeline\` - Show your open pipeline
• \`/pipeline this quarter\` - Pipeline closing this quarter
• \`/pipeline enterprise\` - Deals over $100k
• \`/pipeline in proposal\` - Deals in proposal stage
• \`/pipeline Julie\` - Julie's pipeline
• \`/pipeline healthcare\` - Healthcare industry deals

*Special Commands:*
• \`/pipeline help\` - Show this help
• \`/pipeline clear\` - Clear conversation context

*Tips:*
• Be conversational - "show me my big deals this month"
• Follow up with refinements - "now just enterprise"
• I remember context within our conversation`;
}

/**
 * Forecast help text
 */
function getForecastHelp() {
  return `📈 *Forecast Command Help*

Usage: \`/forecast [query]\`

*Examples:*
• \`/forecast\` - Show current forecast
• \`/forecast this quarter\` - Q4 forecast
• \`/forecast commit only\` - Only committed deals
• \`/forecast best case\` - Best case scenario
• \`/forecast by owner\` - Forecast by rep
• \`/forecast coverage\` - Pipeline coverage

*Forecast Categories:*
• **Commit** - High confidence deals
• **Best Case** - Optimistic scenario
• **Pipeline** - All open deals
• **Omitted** - Excluded from forecast

*Tips:*
• Ask about specific time periods
• Compare forecast categories
• Group by owner, stage, or product`;
}

/**
 * Deals help text
 */
function getDealsHelp() {
  return `🔍 *Deals Command Help*

Usage: \`/deals [query]\`

*Examples:*
• \`/deals closed today\` - Today's wins
• \`/deals over 500k\` - Large deals
• \`/deals closing this week\` - Deals closing soon
• \`/deals new business\` - New customer deals
• \`/deals in negotiation\` - Deals being negotiated
• \`/deals at Resmed\` - Deals at specific account

*Deal Types:*
• **New Business** - New customers
• **Upsell** - Expansion deals
• **Renewal** - Contract renewals

*Time Periods:*
• today, yesterday, this week, this month
• this quarter, last quarter, next 30 days

*Tips:*
• Combine filters: "enterprise deals closing this month"
• Ask about specific accounts or reps
• Use natural language`;
}

/**
 * Activity help text
 */
function getActivityHelp() {
  return `⚠️ *Activity Command Help*

Usage: \`/activity [query]\`

*Examples:*
• \`/activity\` - Deals needing attention (30+ days stale)
• \`/activity 60 days\` - Deals stale for 60+ days
• \`/activity stuck in discovery\` - Discovery stage issues
• \`/activity by owner\` - Activity by rep
• \`/activity enterprise only\` - Large stale deals

*Activity Indicators:*
• **Stale** - No activity in 30+ days
• **Stuck** - Same stage for 60+ days
• **At Risk** - Closing soon with low probability

*Tips:*
• Focus on high-value stale deals
• Check specific stages or reps
• Use for pipeline hygiene reviews`;
}

module.exports = {
  registerSlashCommands
};
