# Quick Info Needed - Source Salesforce

**Username:** jh.keigan.pesenti@eudia.com  
**Password:** keigan3797  
**Missing:** Security Token

---

## Get Security Token (2 minutes)

### Option 1: From Email
1. Check email for jh.keigan.pesenti@eudia.com
2. Look for Salesforce security token email
3. Copy the token (long alphanumeric string)

### Option 2: Reset to Get New Token
1. Log into Source Salesforce: https://login.salesforce.com/
2. Use: jh.keigan.pesenti@eudia.com / keigan3797
3. Click your profile picture → Settings
4. Left sidebar: Personal → Reset My Security Token
5. Click "Reset Security Token"
6. Check email for new token
7. Copy and share with me

---

## What I'll Do Once I Have Token

**Phase 1: Connect & Extract (30 min)**
1. Connect to Source SF with your credentials
2. Use Metadata API to describe ALL custom objects in screenshot:
   - Project__c
   - Version Item Project Detail
   - Project Task Assignment
   - Project Task
   - Project Task Points History
   - [All 19 objects shown]

3. For EACH object, extract:
   - All custom fields
   - Field types, lengths, picklists
   - Formulas, validation rules
   - Relationships/lookups
   - Default values

**Phase 2: Generate Report (15 min)**
4. Create comparison: What exists in Source vs Target
5. Generate creation manifest
6. Show you what will be created
7. Get your approval

**Phase 3: Bulk Create (45 min)**
8. Create custom objects in Target SF
9. Create all fields for each object
10. Verify creation successful
11. Generate completion report

**Total:** ~90 minutes once I have security token

---

## Answer to Your Questions

**Q: Do we need app/permissions like GTM-brain?**  
**A:** No! We're using direct API access (jsforce), not building a Slack app. Just need username + password + security token.

**Q: Can you replicate entire objects with fields?**  
**A:** Yes! Metadata API gives me everything:
- Object definition
- ALL fields automatically
- Field types, picklists, formulas
- Relationships
- I'll replicate complete objects

**Q: Do you need individual field lists?**  
**A:** No! Once I connect, I can extract all fields automatically from each object.

---

## Next Step

**Share security token for:** jh.keigan.pesenti@eudia.com

Then I'll:
1. Connect to Source SF
2. Extract ALL Project objects + fields
3. Show you what will be created
4. Create in Target SF
5. Done!

---

**Just need the security token and I can start!** 🚀

