#!/usr/bin/env node

/**
 * PWA Version Updater
 *
 * Updates the ngsw-config.json version with a timestamp-based version
 * to ensure Service Worker detects changes on every deployment.
 *
 * Version format: MAJOR.MINOR.TIMESTAMP
 * Example: 1.0.1736177234567
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(__dirname, '..', 'ngsw-config.json');

function updatePwaVersion() {
  try {
    // Read current config
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    // Generate new version with timestamp
    const timestamp = Date.now();
    const baseVersion = config.appData.version.split('.').slice(0, 2).join('.'); // Keep major.minor
    const newVersion = `${baseVersion}.${timestamp}`;

    // Try to get git commit hash for additional context
    let gitHash = '';
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.warn('⚠️  Git not available, using timestamp only');
    }

    // Update version
    config.appData.version = newVersion;

    // Add build metadata
    if (!config.appData.build) {
      config.appData.build = {};
    }
    config.appData.build.timestamp = new Date().toISOString();
    if (gitHash) {
      config.appData.build.commit = gitHash;
    }

    // Write updated config
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');

    console.log('✅ PWA version updated successfully!');
    console.log(`   Version: ${newVersion}`);
    if (gitHash) {
      console.log(`   Commit: ${gitHash}`);
    }
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    return newVersion;
  } catch (error) {
    console.error('❌ Failed to update PWA version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updatePwaVersion();
}

module.exports = { updatePwaVersion };
