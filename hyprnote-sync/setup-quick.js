#!/usr/bin/env node

/**
 * Quick Setup - Streamlined for Eudia Team
 * 
 * Auto-detects user from Hyprnote profile, looks up their SF User ID,
 * and configures everything with minimal input.
 * 
 * Run with: npm run setup
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const hyprnote = require('./lib/hyprnote');
const teamRegistry = require('./lib/team-registry');

const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const SYNCED_FILE = path.join(__dirname, 'data', 'synced-sessions.json');

async function question(rl, prompt) {
  return new Promise(resolve => {
    rl.question(prompt + ' ', resolve);
  });
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         HYPRNOTE → SALESFORCE SYNC SETUP                  ║');
  console.log('║                   Quick Setup for Eudia Team              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // Step 1: Check Hyprnote
    console.log('[1/3] Checking Hyprnote...');
    
    const hyprnoteStatus = await hyprnote.testConnection();
    
    if (!hyprnoteStatus.success) {
      console.log('\n❌ Hyprnote not found!');
      console.log('   Please install Hyprnote from https://hyprnote.com/');
      console.log('   Then record at least one test meeting.\n');
      rl.close();
      process.exit(1);
    }
    
    console.log('   ✓ Hyprnote connected (' + hyprnoteStatus.sessionCount + ' sessions)\n');
    
    // Step 2: Auto-detect user from Hyprnote
    console.log('[2/3] Detecting your profile...');
    
    const hyprnoteUser = await hyprnote.getCurrentUser();
    let detectedMember = null;
    
    if (hyprnoteUser?.email) {
      detectedMember = teamRegistry.findByEmail(hyprnoteUser.email);
    }
    if (!detectedMember && hyprnoteUser?.full_name) {
      detectedMember = teamRegistry.findByName(hyprnoteUser.full_name);
    }
    
    let finalMember = null;
    
    if (detectedMember) {
      console.log('   ✓ Detected: ' + detectedMember.name + ' (' + detectedMember.role + ')');
      console.log('   Salesforce ID: ' + detectedMember.salesforceUserId);
      
      const confirm = await question(rl, '\n   Is this correct? (Y/n):');
      
      if (confirm.toLowerCase() !== 'n') {
        finalMember = detectedMember;
      }
    } else {
      console.log('   ⚠ Could not auto-detect your profile');
    }
    
    // Manual selection if auto-detect failed
    if (!finalMember) {
      console.log('\n   Select your name from the team list:\n');
      
      const allMembers = teamRegistry.getAllMembers();
      allMembers.forEach((member, index) => {
        console.log('   [' + (index + 1) + '] ' + member.name + ' (' + member.role + ')');
      });
      
      const selection = await question(rl, '\n   Enter number (1-' + allMembers.length + '):');
      const selectedIndex = parseInt(selection) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < allMembers.length) {
        finalMember = allMembers[selectedIndex];
      } else {
        // Manual entry as fallback
        console.log('\n   Manual entry:');
        const name = await question(rl, '   Your name:');
        const email = await question(rl, '   Your email:');
        const userId = await question(rl, '   Salesforce User ID (ask admin if unsure):');
        
        finalMember = {
          name: name,
          email: email,
          salesforceUserId: userId,
          role: 'Team Member',
          team: 'Unknown'
        };
      }
    }
    
    if (!finalMember) {
      console.log('\n❌ Setup cancelled.\n');
      rl.close();
      process.exit(1);
    }
    
    // Step 3: Save configuration
    console.log('\n[3/3] Saving configuration...');
    
    const config = {
      rep: {
        name: finalMember.name,
        email: finalMember.email || (finalMember.name.toLowerCase().replace(' ', '.') + '@eudia.com'),
        salesforceUserId: finalMember.salesforceUserId,
        role: finalMember.role,
        team: finalMember.team
      },
      salesforce: {
        useEnvFile: true  // Uses central credentials
      },
      hyprnote: {
        path: hyprnoteStatus.path,
        version: hyprnoteStatus.version
      },
      settings: {
        lookbackHours: 168,  // 7 days
        updateCustomerBrain: true,
        createContacts: true,
        syncOwnedAccountsFirst: true  // Prioritize accounts they own
      },
      setupDate: new Date().toISOString()
    };
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    // Initialize synced sessions file
    if (!fs.existsSync(SYNCED_FILE)) {
      fs.writeFileSync(SYNCED_FILE, JSON.stringify({ sessions: [] }, null, 2));
    }
    
    console.log('   ✓ Configuration saved!\n');
    
    // Success message
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                   SETUP COMPLETE!                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('   Welcome, ' + finalMember.name + '!');
    console.log('\n');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │  HOW TO USE                                         │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │                                                     │');
    console.log('   │  1. RECORD: Open Hyprnote → New Note → Record      │');
    console.log('   │                                                     │');
    console.log('   │  2. SYNC:   After calls, run: npm run sync         │');
    console.log('   │             (or: node sync.js)                      │');
    console.log('   │                                                     │');
    console.log('   │  3. CHECK:  View status: npm run status            │');
    console.log('   │                                                     │');
    console.log('   └─────────────────────────────────────────────────────┘');
    console.log('\n');
    console.log('   Your meeting notes will sync to Salesforce:');
    console.log('   • Events created on matched Accounts');
    console.log('   • Customer Brain updated with insights');
    console.log('   • All activity attributed to you\n');
    
  } catch (error) {
    console.log('\n❌ Setup failed: ' + error.message);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

