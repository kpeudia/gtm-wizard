# Salesforce Quick Reference Guide for Sales Team

**Last Updated:** November 19, 2025 | **Version:** 1.0  
**Audience:** Sales Professionals | **Purpose:** Essential Salesforce knowledge for day-to-day operations

---

## ACCOUNT MANAGEMENT

### What is an Account?
An **Account** is a company or organization you're selling to. Each account has one owner (Business Lead) responsible for the relationship.

### Critical Account Fields

| Field | What It Means | Your Action |
|-------|---------------|-------------|
| **Customer Type** | Current relationship status | Set based on deal stage |
| **Account Owner** | Who owns this relationship | Contact them before engaging |
| **Headquarters Location** | Where company is based | Auto-populated, used for assignment |
| **Annual Revenue** | Company size indicator | Helps prioritize accounts |

### Customer Type Classifications

- **LOI, no $ attached** - Signed LOI, no financial commitment yet
- **LOI, with $ attached** - Signed LOI with committed dollar amount
- **Pilot** - Running pilot program, not yet customer
- **ARR** - Active customer with recurring revenue contract

### Account Assignment Rules

**Geographic-Based:**
- **West Coast states** → Himanshu, Julie, or Justin
- **East Coast states** → Olivia
- **International** → Johnson or Hannah
- **Auto-assigned based on lowest current workload**

**Key Rule:** Don't create accounts yourself—use GTM-Wizard to auto-assign correctly

---

## OPPORTUNITY MANAGEMENT

### What is an Opportunity?
An **Opportunity** is a specific deal or sales cycle. One account can have multiple opportunities.

### Stage Definitions (In Order)

| Stage | What It Means | Your Action |
|-------|---------------|-------------|
| **Stage 0 - Qualifying** | Initial contact, determining fit | Qualify or disqualify quickly |
| **Stage 1 - Discovery** | Understanding needs, pain points | Deep discovery, document use cases |
| **Stage 2 - SQO** | Solution presented, qualified opportunity | Proposal preparation, SOW scoping |
| **Stage 3 - Pilot** | Running pilot program | Drive pilot success, gather metrics |
| **Stage 4 - Proposal** | Contract negotiation, final stages | Close the deal, legal review |
| **Closed Won** | Deal signed, customer onboarded | Handoff to CS, celebrate! |
| **Closed Lost** | Deal lost to competitor or no decision | Document loss reason, learn |

### Critical Opportunity Fields

| Field | Purpose | Required? |
|-------|---------|-----------|
| **Amount (ACV)** | Deal size in dollars | Yes - update as you learn |
| **Close Date / Target LOI Date** | When deal expected to close | Yes - keep current |
| **Revenue Type** | Booking, ARR, or Project | Yes - determines metrics |
| **Product Line** | Which product(s) they're buying | Yes - for forecasting |
| **Stage** | Current sales stage | Yes - update as you progress |
| **Next Steps** | What happens next | Yes - always document |
| **Owner** | Who's responsible | Auto-assigned with account |

### Revenue Type Explained

- **Booking** - One-time purchase or LOI signing
- **ARR** - Annual Recurring Revenue (subscription/ongoing)
- **Project** - Project-based engagement

### Product Lines

- **AI-Augmented Contracting** - Contract review and automation
- **Augmented-M&A** - M&A due diligence and deal support
- **Compliance** - Compliance monitoring and reporting
- **sigma** - Analytics and insights platform
- **Cortex** - [Product description]
- **Multiple** - Buying multiple products

---

## STAGE MOVEMENT BEST PRACTICES

### When to Move Stages

**0 → 1 (Qualifying → Discovery):**
- Champion identified
- Budget conversation started
- Use case confirmed

**1 → 2 (Discovery → SQO):**
- Clear use cases documented
- Budget range confirmed
- Decision process understood
- Technical requirements gathered

**2 → 3 (SQO → Pilot):**
- Proposal accepted
- Pilot SOW signed
- Pilot timeline confirmed

**3 → 4 (Pilot → Proposal):**
- Pilot successful (documented)
- Ready for commercial discussion
- Legal review initiated

**4 → Closed Won:**
- Contract signed
- Payment terms agreed
- Implementation scheduled

### What Requires Manager Approval

- **Discounts > 15%** - RevOps approval required
- **Custom contract terms** - Legal review required
- **Payment plans > 90 days** - Finance approval required
- **Pilot extensions** - VP approval required

### Data Hygiene Rules

**Required Before Moving to Stage 2:**
- ✅ Amount field populated (best estimate)
- ✅ Target LOI Date set
- ✅ Product Line selected
- ✅ Revenue Type set
- ✅ Champion documented (Account field)
- ✅ Use cases documented (Account field)

**Update Weekly (Minimum):**
- Next Steps field
- Close Date (if timeline changes)
- Stage (if progress made)

**Never:**
- Create opportunities without accounts
- Skip stages (must progress sequentially)
- Leave Amount at $0 past Stage 1
- Forget to document loss reasons (Closed Lost)

---

## QUICK REFERENCE

### Common GTM-Wizard Commands

**Account Checks:**
- `does [Company] exist?` - Check if account exists
- `who owns [Company]?` - Find account owner
- `who's the BL for [Company]?` - Business lead lookup

**Account Management:**
- `create [Company] and assign to BL` - Create with auto-assignment
- `assign [Company] to [BL Name]` - Manual assignment
- `move [Company] to nurture` - Mark as nurture

**Pipeline Queries:**
- `late stage contracting` - See Stage 4 contracting accounts
- `mid stage deals` - See Stage 2-3 opportunities
- `show me the pipeline` - All active opportunities
- `what deals closed this week?` - Recent wins

**Data Queries:**
- `what's the account plan for [Company]?` - View strategy
- `contracts for [Company]` - Find contracts and PDFs
- `what LOIs signed last week?` - Recent bookings

**Reporting:**
- `send pipeline excel report` - Generate current pipeline Excel

### Who to Ask for Help

| Question Type | Contact |
|---------------|---------|
| Salesforce access/permissions | IT / Admin |
| Forecasting questions | RevOps |
| Deal structure/pricing | Sales Leadership |
| Contract terms | Legal |
| Product questions | Product Team |
| Technical requirements | Solutions Engineering |
| GTM-Wizard help | Keigan or #gtm-wizard-help |

### Data Hygiene Checklist

**Daily:**
- [ ] Update Next Steps on active deals
- [ ] Log activities in Salesforce
- [ ] Respond to Slack notifications

**Weekly:**
- [ ] Review Close Dates for accuracy
- [ ] Update stages if progress made
- [ ] Clean up stale opportunities
- [ ] Document customer conversations

**Monthly:**
- [ ] Review entire pipeline
- [ ] Update account plans for strategic accounts
- [ ] Archive dead opportunities
- [ ] Update competitor intelligence

---

## FIELD NAMING CONVENTIONS

### Accounts
- **Format:** [Company Legal Name]
- **Examples:** "Intel Corporation", "Microsoft Corporation"
- **Not:** "Intel (West)", "Intel - CA Office"

### Opportunities
- **Format:** [Account Name] - [Product] - [Type]
- **Examples:** 
  - "Intel - ARR - Contracting"
  - "Microsoft - Booking - M&A"
  - "Apple - Project - Compliance"

---

## TIPS FOR SUCCESS

1. **Use GTM-Wizard First** - Faster than navigating Salesforce
2. **Document as You Go** - Don't wait to update fields
3. **Keep Close Dates Current** - Forecast accuracy depends on it
4. **Ask Questions** - Better to ask than guess
5. **Update Account Plans** - After every significant customer interaction
6. **Clean Data = Better Insights** - Garbage in, garbage out

---

## COMMON MISTAKES TO AVOID

| Mistake | Why It's Bad | How to Fix |
|---------|--------------|------------|
| Creating duplicate accounts | Data fragmentation | Use "does [Company] exist?" first |
| Skipping stages | Breaks forecasting | Progress through stages in order |
| Leaving Amount blank | Can't forecast | Enter best estimate, update as you learn |
| Wrong Revenue Type | Metrics broken | Booking = LOI, ARR = recurring |
| Not documenting loss reasons | Can't improve | Always explain why lost |
| Orphaned opportunities | Can't track properly | Always link to an account |

---

## NEED MORE HELP?

**GTM-Wizard Help:**
- Ask `hello` in Slack for capability overview
- Review: GTM_WIZARD_CAPABILITIES.html
- Channel: #gtm-wizard-help

**Salesforce Training:**
- Salesforce Trailhead (internal link)
- RevOps office hours (Fridays 2-3 PM)
- New hire onboarding deck

**Escalation:**
- Urgent issues: Ping RevOps in Slack
- Access problems: IT ticket
- Data questions: Weekly sales meeting

---

**Remember:** Good data hygiene isn't extra work—it's how we win more deals through better insights.

*Questions? Ask in #gtm-wizard-help or ping RevOps*

