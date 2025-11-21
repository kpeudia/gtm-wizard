# Source Salesforce OAuth Setup

**Your Org Uses:** OAuth 2.0 (more secure than security tokens!)  
**Credentials:** jh.keigan.pesenti@eudia.com / keigan3797  
**Need:** Client ID + Client Secret from Connected App

---

## What I Need

For OAuth Username-Password flow (programmatic access):

1. **Client ID** (Consumer Key)
2. **Client Secret** (Consumer Secret)
3. **Username** (you provided: jh.keigan.pesenti@eudia.com)
4. **Password** (you provided: keigan3797)
5. **Instance URL** (e.g., https://yourcompany.my.salesforce.com)

**No security token needed with OAuth!**

---

## How to Get Client ID + Secret (10 minutes)

### Step 1: Create Connected App in Source Salesforce

1. **Log into Source SF:** https://login.salesforce.com/
   - Use: jh.keigan.pesenti@eudia.com / keigan3797

2. **Go to Setup**
   - Click gear icon → Setup

3. **Create Connected App**
   - In Quick Find: Type "App Manager"
   - Click "App Manager"
   - Click "New Connected App"

4. **Fill in Basic Information:**
   - **Connected App Name:** "GTM-Brain Metadata Extractor"
   - **API Name:** GTM_Brain_Metadata_Extractor
   - **Contact Email:** keigan.pesenti@eudia.com

5. **Enable OAuth Settings:**
   - Check: ☑ "Enable OAuth Settings"
   - **Callback URL:** `https://login.salesforce.com/services/oauth2/callback`
   - **Selected OAuth Scopes:** Add these:
     - Full access (full)
     - Perform requests at any time (refresh_token, offline_access)
     - Access and manage your data (api)

6. **Save**
   - Click "Save"
   - Click "Continue"

7. **Get Credentials**
   - You'll see: "Consumer Key" and "Consumer Secret"
   - Click "Manage Consumer Details" to see Consumer Secret
   - Copy both

### Step 2: Share With Me

Copy and share:
```
Source SF Client ID: [Consumer Key from step 7]
Source SF Client Secret: [Consumer Secret from step 7]
Source SF Instance URL: [e.g., https://company.my.salesforce.com]
```

---

## Alternative: If You Can't Create Connected App

If you don't have permission to create Connected Apps:

**Option A:** Ask Source SF admin to create it for you  
**Option B:** Use Salesforce CLI with OAuth (I can guide you)  
**Option C:** Export metadata manually (slower, but works)

---

## What Happens Next

Once I have OAuth credentials:

1. **I'll create connection to Source SF** (5 min)
   ```javascript
   const sourceConn = new jsforce.Connection({
     oauth2: {
       clientId: '[YOUR_CLIENT_ID]',
       clientSecret: '[YOUR_CLIENT_SECRET]'
     },
     instanceUrl: '[YOUR_INSTANCE_URL]'
   });
   await sourceConn.login(username, password); // No token needed!
   ```

2. **Extract metadata** for all 19 Project objects (20 min)

3. **Generate creation scripts** for Target SF (15 min)

4. **Execute bulk creation** in Target SF (30 min)

5. **Validate** all objects created successfully (10 min)

**Total:** ~90 minutes

---

## Next Step

Create Connected App in Source SF and share:
- Client ID
- Client Secret  
- Instance URL

Then I'll start extraction immediately!

