# Clay API - Finding the Correct Endpoint

**Issue Found:** `/v1/enrichment/company` is deprecated!

**Response:** `{"success":false,"message":"deprecated API endpoint"}`

---

## How to Find the Correct Endpoint

### Option 1: Check Clay Dashboard (FASTEST)

1. Log into Clay: https://app.clay.com/
2. Go to: Settings → API or Developer section
3. Look for: API Documentation or API Reference
4. Find: Company enrichment endpoint
5. Share: The correct endpoint URL and example

### Option 2: Check Clay Documentation

Visit: https://docs.clay.com/ or https://clay.com/docs
Look for: API Reference
Find: Company/Organization enrichment endpoint

### Option 3: Contact Clay Support

Email: support@clay.com
Ask: "What's the correct API endpoint for company enrichment? The v1/enrichment/company endpoint shows deprecated."

---

## What I Need

Once you find the correct endpoint, share:

1. **Endpoint URL** - e.g., `/v2/companies/enrich` or whatever it is
2. **Request format** - How to structure the request body
3. **Response format** - What fields Clay returns

Example from Clay docs might look like:
```
POST https://api.clay.com/v2/companies/enrich
{
  "domain": "levistrauss.com"
}
```

Or:
```
POST https://api.clay.com/api/companies
{
  "name": "Levi Strauss"
}
```

---

## Temporary Fix (While We Find Endpoint)

I've already implemented:
✅ Proper company name casing for ALL companies
✅ Mock enrichment for test companies
✅ Duplicate detection
✅ All other features working

**For now:**
- Account creation works (proper casing fixed!)
- Enrichment fields will be empty (manual entry in Salesforce)
- Once we get correct Clay endpoint, enrichment will work for all companies

---

## Next Steps

**YOU:**
1. Check Clay dashboard for API documentation
2. Or contact Clay support for current endpoint
3. Share the endpoint details with me

**ME:**
4. Update Clay integration with correct endpoint (5 minutes)
5. Test with real company
6. Enrichment works for all Fortune 2000!

---

**For now, company creation works with proper casing - just missing enrichment data until we get correct Clay API endpoint!**

