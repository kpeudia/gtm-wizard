# GTM Brain - Elite Sales Intelligence Slack Bot

A production-grade Slack bot that transforms natural language queries into precise Salesforce data pulls. Built for sales teams who need instant access to pipeline, forecast, and deal intelligence.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Redis server
- Slack workspace with admin access
- Salesforce org with API access
- OpenAI API key

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd gtm-brain
npm run setup
```

2. **Follow the setup wizard** to configure your credentials

3. **Start the bot:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🤖 What GTM Brain Can Do

### Natural Language Queries
Ask questions like a human, get precise data:

- **"What closed this week?"** → Shows all won deals from the past 7 days
- **"Show me enterprise deals in proposal"** → Filters to $100k+ deals in proposal stage
- **"Julie's pipeline this quarter"** → Julie's open deals closing this quarter
- **"What's stale in discovery?"** → Discovery stage deals with no activity 30+ days
- **"Compare this month vs last month wins"** → Month-over-month performance analysis

### Conversation Context
GTM Brain remembers your conversation:
```
You: "Show me pipeline"
Bot: [Shows full pipeline]
You: "Now just enterprise"
Bot: [Filters to enterprise deals only]
You: "Sort by close date"
Bot: [Re-orders by close date]
```

### Multiple Interfaces

#### 1. **Direct Messages**
Private queries and personal pipeline reviews

#### 2. **Channel Mentions**
Team discussions with shared results:
```
@gtmbrain what's closing this month?
```

#### 3. **Slash Commands**
Quick access to common queries:
- `/pipeline` - Pipeline analysis
- `/forecast` - Forecast review
- `/deals` - Deal lookups
- `/activity` - Activity checks

### Automated Insights
Daily, weekly, and monthly reports delivered to configured channels:

- **Daily Summary** (8 AM): Deals closing today, yesterday's results, stale deal alerts
- **Weekly Pipeline Review** (Monday 9 AM): Pipeline by stage, week-over-week growth
- **End of Day Alerts** (6 PM): Stage movements, date changes
- **Deal Health Checks** (Every 2 hours): At-risk deal notifications

## 📊 Query Examples

### Executive Questions
```
"Are we on track to hit the quarter?"
"Show me our biggest deals in flight"
"What's our win rate trending?"
"Where are we losing deals?"
```

### Sales Manager Questions
```
"Which reps need help?"
"Show me stalled deals over 30 days"
"Who's forecasting what?"
"What's moving forward vs backward?"
```

### Account Executive Questions
```
"What do I own that's closing this month?"
"Show my top 5 deals"
"What needs attention?"
"Give me all my enterprise deals"
```

### RevOps Analytics
```
"Break down pipeline by product line"
"What's our velocity by segment?"
"Show me conversion rates from demo to close"
"Pipeline coverage ratio"
```

## ⚙️ Configuration

### Environment Variables

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token

# Salesforce OAuth
SF_CLIENT_ID=your-client-id
SF_CLIENT_SECRET=your-client-secret
SF_INSTANCE_URL=https://yourorg.my.salesforce.com
SF_USERNAME=your-username
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=your-security-token

# OpenAI
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# Redis
REDIS_URL=redis://localhost:6379

# Notification Channels (optional)
SALES_LEADERSHIP_CHANNEL=#sales-leadership
SALES_TEAM_CHANNEL=#sales-team
SALES_MANAGERS_CHANNEL=#sales-managers
REVENUE_OPS_CHANNEL=#revenue-ops
```

### Business Logic Configuration

Customize deal segments, health indicators, and thresholds in `data/business-logic.json`:

```json
{
  "segments": {
    "enterprise": {"definition": "Amount >= 100000", "label": "Enterprise"},
    "mid-market": {"definition": "Amount >= 25000 AND Amount < 100000", "label": "Mid-Market"},
    "smb": {"definition": "Amount < 25000", "label": "SMB"}
  },
  "deal_health": {
    "stale": {"definition": "LastActivityDate < LAST_N_DAYS:30", "label": "Stale"},
    "at_risk": {"definition": "CloseDate < NEXT_N_DAYS:7 AND Probability < 50", "label": "At Risk"}
  }
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Slack App     │    │   GTM Brain     │    │   Salesforce    │
│                 │    │                 │    │                 │
│ • Messages      │◄──►│ • Intent Parser │◄──►│ • SOQL Queries  │
│ • Slash Cmds    │    │ • Query Builder │    │ • Metadata API  │
│ • Interactions  │    │ • Context Mgmt  │    │ • OAuth Flow    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   OpenAI GPT-4  │    │     Redis       │
                       │                 │    │                 │
                       │ • Intent Parse  │    │ • Conversation  │
                       │ • Entity Extract│    │ • Cache Layer   │
                       │ • Context Aware │    │ • Rate Limiting │
                       └─────────────────┘    └─────────────────┘
```

### Key Components

- **Intent Parser**: GPT-4 powered natural language understanding
- **Context Manager**: Conversation state and follow-up handling
- **Query Builder**: Dynamic SOQL generation from entities
- **Response Formatter**: Human-readable output with rich formatting
- **Connection Manager**: Salesforce OAuth and connection pooling
- **Cache Layer**: Redis-backed caching and rate limiting

## 🔧 Development

### Project Structure
```
gtm-brain/
├── src/
│   ├── app.js                 # Main application entry
│   ├── salesforce/            # Salesforce integration
│   │   ├── connection.js      # OAuth & connection management
│   │   ├── queries.js         # SOQL query builders
│   │   └── metadata.js        # Schema caching
│   ├── ai/                    # AI/ML components
│   │   ├── intentParser.js    # GPT-4 intent classification
│   │   └── contextManager.js  # Conversation state
│   ├── slack/                 # Slack integration
│   │   ├── events.js          # Message handlers
│   │   ├── commands.js        # Slash commands
│   │   ├── interactive.js     # Buttons/modals
│   │   └── scheduled.js       # Automated reports
│   └── utils/                 # Utilities
│       ├── cache.js           # Redis wrapper
│       ├── logger.js          # Structured logging
│       ├── validators.js      # Input validation
│       └── formatters.js      # Output formatting
├── data/                      # Configuration
│   ├── schema-opportunity.json # Salesforce field mappings
│   ├── schema-account.json    # Account field mappings
│   ├── business-logic.json    # Business rules
│   └── sample-queries.json    # Training examples
└── tests/                     # Test suites
```

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Linting
```bash
npm run lint           # Check code style
npm run lint:fix       # Auto-fix issues
```

## 📝 Slack App Setup

### 1. Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "GTM Brain" 
4. Select your workspace

### 2. Configure OAuth & Permissions
**Bot Token Scopes:**
- `app_mentions:read`
- `channels:history`
- `chat:write`
- `commands`
- `im:history`
- `im:write`
- `users:read`

### 3. Enable Socket Mode
1. Go to "Socket Mode" → Enable
2. Generate App-Level Token with `connections:write` scope

### 4. Create Slash Commands
- `/pipeline` - Pipeline analysis and queries
- `/forecast` - Forecast review and analysis  
- `/deals` - Deal lookup and filtering
- `/activity` - Activity checks and stale deal alerts

### 5. Enable Events
**Subscribe to Bot Events:**
- `app_mention`
- `message.im`

### 6. Install to Workspace
Click "Install to Workspace" and authorize permissions.

## 🔐 Salesforce Setup

### 1. Create Connected App
1. Setup → App Manager → New Connected App
2. **Basic Information:**
   - Connected App Name: "GTM Brain Slack Bot"
   - API Name: Auto-generated
   - Contact Email: Your email

3. **OAuth Settings:**
   - Enable OAuth Settings: ✓
   - Callback URL: `http://localhost:3000/oauth/callback`
   - Selected OAuth Scopes:
     - Access the identity URL service (id, profile, email, address, phone)
     - Manage user data via APIs (api)
     - Perform requests at any time (refresh_token, offline_access)

4. **Save** and note Consumer Key & Consumer Secret

### 2. Get Security Token
1. Setup → My Personal Information → Reset My Security Token
2. Check email for security token

### 3. Test Connection
The bot will authenticate on startup using username/password flow.

## 🚨 Troubleshooting

### Common Issues

**"Salesforce connection failed"**
- Verify username, password, and security token
- Check if your IP is whitelisted in Salesforce
- Ensure Connected App is properly configured

**"Redis connection refused"**
- Make sure Redis server is running
- Check Redis URL and credentials
- For macOS: `brew install redis && brew services start redis`

**"OpenAI API error"**
- Verify API key is correct
- Check API usage limits
- Ensure sufficient credits

**"Slack events not received"**
- Verify Socket Mode is enabled
- Check App-Level Token permissions
- Ensure bot is added to channels

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging:

```bash
LOG_LEVEL=debug npm start
```

### Health Checks
- **Application**: `http://localhost:3000/health`
- **Metrics**: `http://localhost:3000/metrics`

## 📈 Monitoring & Analytics

### Logging
Structured JSON logs with context:
- Salesforce query performance
- AI request metrics  
- User interaction patterns
- Error tracking with stack traces

### Metrics
Built-in metrics endpoint provides:
- Memory usage
- Uptime
- Request counts
- Cache hit rates

### Production Monitoring
Configure optional monitoring services:
```bash
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
```

## 🔒 Security

### Input Validation
- All user inputs are sanitized
- SOQL injection prevention
- Rate limiting per user
- Conversation context expiration

### Authentication
- OAuth 2.0 for Salesforce
- Refresh token rotation
- Encrypted credential storage
- Principle of least privilege

### Data Privacy
- No sensitive data logged
- Conversation context auto-expires
- Configurable data retention
- Audit trail for all queries

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open GitHub issue with detailed description
- **Questions**: Use GitHub Discussions for general questions

---

**GTM Brain** - Transforming sales conversations into data-driven insights. 🧠⚡

# gtm-wizard
