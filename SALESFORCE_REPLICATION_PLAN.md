# Salesforce Object & Field Replication - Strategic Plan

**Goal:** Replicate custom objects and fields from Source SF to Target SF  
**Approach:** Automated metadata extraction and creation  
**Time Estimate:** 2-4 hours setup, then bulk operations

---

## Overview

**Source Salesforce:** Other instance being merged (you have admin)  
**Target Salesforce:** Your current instance (Eudia - already connected)  
**Task:** Create custom objects + fields that exist in Source but not in Target

---

## Strategic Approach

### Phase 1: Metadata Discovery (30 min)

**1.1 Connect to Source Salesforce**
- Use jsforce with second set of credentials
- Read-only access sufficient
- Extract metadata via Salesforce Metadata API

**1.2 Identify What to Replicate**
- List all custom objects in Source
- List all custom fields per object
- Extract: Field types, picklist values, formulas, validations
- Generate comparison report

**1.3 Compare with Target**
- Query Target Salesforce for existing objects/fields
- Identify gaps (what exists in Source but not Target)
- Create replication manifest

---

### Phase 2: Metadata Extraction (1 hour)

**2.1 Extract Object Definitions**
For each custom object in Source:
- Object API name
- Object label
- Plural label
- Description
- Record types (if any)

**2.2 Extract Field Definitions**
For each field:
- Field API name
- Field label
- Field type (Text, Number, Picklist, Formula, etc.)
- Length/precision
- Required/optional
- Default value
- Picklist values (if picklist)
- Formula (if formula field)
- Help text
- Validation rules

**2.3 Generate Creation Scripts**
- Metadata API XML files
- OR jsforce create commands
- OR Salesforce CLI commands

---

### Phase 3: Bulk Creation (1-2 hours)

**3.1 Create Objects First**
- Deploy custom objects to Target
- Verify creation successful

**3.2 Create Fields in Batches**
- Group by field type
- Create in logical order
- Handle dependencies (lookups, formulas)

**3.3 Validation**
- Verify all objects created
- Verify all fields created
- Compare Source vs Target metadata

---

## Implementation Options

### Option A: Salesforce CLI + Metadata API (RECOMMENDED)

**Pros:** Official Salesforce approach, handles all field types  
**Cons:** Requires Salesforce CLI installed

**Steps:**
1. Extract metadata from Source using CLI
2. Generate deployment package
3. Deploy to Target using CLI
4. Fast, handles dependencies automatically

### Option B: jsforce Scripting (PROGRAMMATIC)

**Pros:** Full control, can customize, already have jsforce  
**Cons:** More manual, need to handle field type variations

**Steps:**
1. Query Source metadata via jsforce
2. Generate creation scripts
3. Execute batch creates in Target
4. Good for selective replication

### Option C: Manual with Automation Assist (HYBRID)

**Pros:** Review each field before creating, safest  
**Cons:** Slower, more manual work

**Steps:**
1. I generate CSV of all objects/fields from Source
2. You review and mark which to replicate
3. I generate creation scripts for marked items
4. You review scripts
5. Execute creation

---

## What I Need From You

### Immediate Information:

**1. Source Salesforce Credentials**
```
Source SF Username: ?
Source SF Password: ?
Source SF Security Token: ?
Source SF Instance URL: ? (e.g., https://company.my.salesforce.com)
```

**2. Replication Scope**
- Which custom objects to replicate? (list names or "all custom objects")
- All fields or specific fields only?
- Include validation rules?
- Include page layouts?
- Include record types?

**3. Preferred Approach**
- Option A (CLI - fastest)
- Option B (jsforce - most control)
- Option C (hybrid - safest)

---

## Recommended Workflow

**My recommendation: Option B (jsforce scripting)**

**Why:**
- We already have jsforce connected
- Full control over what gets created
- Can handle special cases
- Good logging and error handling
- You can review before execution

**Workflow:**
1. **YOU:** Provide Source SF credentials
2. **ME:** Create connection to Source SF (10 min)
3. **ME:** Extract all custom object metadata (20 min)
4. **ME:** Generate report showing what will be replicated (10 min)
5. **YOU:** Review report, approve (15 min)
6. **ME:** Generate creation scripts (30 min)
7. **YOU:** Review scripts (15 min)
8. **ME:** Execute bulk creation (30 min)
9. **BOTH:** Validate results (30 min)

**Total time:** ~3 hours

---

## Deliverables

1. **Metadata Comparison Report** - What exists in Source vs Target
2. **Replication Manifest** - What will be created
3. **Creation Scripts** - Executable code to create objects/fields
4. **Validation Report** - Confirming successful creation
5. **Documentation** - What was replicated and why

---

## Safety Measures

- **Read-only** connection to Source (no changes to Source)
- **Dry-run mode** first (show what would be created, don't create yet)
- **Batch creation** with error handling
- **Rollback plan** (can delete created objects if needed)
- **Validation** after each batch

---

## Next Steps

**To proceed, I need:**

1. Source Salesforce credentials (can be in .env file or shared securely)
2. List of custom objects to replicate (or "all")
3. Confirmation you want me to proceed with jsforce approach

**Once I have credentials:**
- 10 minutes to connect
- 20 minutes to extract metadata  
- Send you report of what will be replicated
- Get your approval
- Execute creation

---

**Ready to help with this! Share Source SF credentials and scope, and I'll start immediately.** 🚀

**Note:** This is separate from GTM-brain work but uses the same Salesforce expertise.

