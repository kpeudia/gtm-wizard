# Salesforce Quick Reference Guide for Sales Team

Last Updated: November 19, 2025 | Version: 1.0  
Audience: Sales Professionals | Purpose: Essential Salesforce knowledge for day-to-day operations

---

## Account Management

### What is an Account?
An **Account** is a company or organization you're selling to. Each account has one owner (Business Lead) responsible for the relationship.

### Critical account fields

| Field | What it means | Your action |
|-------|---------------|-------------|
| Customer Type | Current relationship status | Set based on deal stage |
| Account Owner | Who owns this relationship | Contact them before engaging |
| Headquarters Location | Where company is based | Auto-populated, used for assignment |
| Annual Revenue | Company size indicator | Helps prioritize accounts |

### Customer type classifications

- LOI, no $ attached - Signed LOI, no financial commitment yet
- LOI, with $ attached - Signed LOI with committed dollar amount
- Pilot - Running pilot program, not yet customer
- Revenue - Active customer with 12+ month contract (recurring revenue)

### Account assignment rules

Geographic-based:
- West Coast states → Himanshu, Julie, or Justin
- East Coast states → Olivia
- International → Johnson or Hannah
- Auto-assigned based on lowest current workload

Key rule: Don't create accounts yourself—use GTM-Wizard to auto-assign correctly

---

## Opportunity Management

### What is an Opportunity?
An **Opportunity** is a specific deal or sales cycle. One account can have multiple opportunities.

### Stage definitions (in order)

| Stage | What it means | Your action |
|-------|---------------|-------------|
| Stage 0 - Qualifying | Trying to schedule initial meeting | EA/BDR schedules meeting on behalf of BL |
| Stage 1 - Discovery | Meeting set, discovering needs and pain points | Conduct discovery, document use cases |
| Stage 2 - SQO | Qualified opportunity, path to close defined | Create Account Plan, prepare proposal |
| Stage 3 - Pilot | Running pilot program | Drive pilot success, gather metrics |
| Stage 4 - Proposal | Contract negotiation, final stages | Close the deal, legal review |
| Closed Won | Deal signed, customer onboarded | Handoff to CS, celebrate! |
| Closed Lost | Deal lost to competitor or no decision | Document loss reason, learn |

### Critical opportunity fields (reviewed/updated weekly on Thursdays)

| Field | Purpose |
|-------|---------|
| ACV | Annual contract value in dollars |
| Stage | Current sales stage (0-4, Won, Lost) |
| Product Line | Which product(s) they're buying |
| Target Sign Date | When deal expected to sign |

### Revenue type explained

- Booking - One-time purchase or LOI signing
- Revenue - 12+ month contracts (recurring revenue)
- Project - Short-term project (e.g., paid pilot)

### Product Lines

- **AI-Augmented Contracting** - Contract review and automation
- **Augmented-M&A** - M&A due diligence and deal support
- **Compliance** - Compliance monitoring and reporting
- **sigma** - Analytics and insights platform
- **Cortex** - [Product description]
- **Multiple** - Buying multiple products

---

## Stage Movement Best Practices

### When to move stages

0 → 1 (Qualifying → Discovery):
- Meeting successfully scheduled
- Initial contact made

1 → 2 (Discovery → SQO):
- Meeting completed, opportunity qualified
- Account Plan created and shared
- Clear use cases documented
- Decision process understood

2 → 3 (SQO → Pilot):
- Proposal accepted
- Pilot SOW signed
- Pilot timeline confirmed

3 → 4 (Pilot → Proposal):
- Pilot successful (documented)
- Ready for commercial discussion
- Legal review initiated

4 → Closed Won:
- Contract signed
- Payment terms agreed
- Implementation scheduled

### Data hygiene rules

Required before moving to Stage 2:
- ACV field populated (best estimate)
- Target Sign Date set
- Product Line selected
- Revenue Type set
- Account Plan created and shared

Update weekly on Thursdays:
- ACV
- Target Sign Date
- Stage (if progress made)
- Product Line

Never:
- Create opportunities without accounts
- Skip stages (must progress sequentially)
- Leave Amount at $0 past Stage 1
- Move to Stage 2 without Account Plan
- Forget to document loss reasons (Closed Lost)

---

## Quick Reference

### Common GTM-Wizard commands

Account checks:
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

