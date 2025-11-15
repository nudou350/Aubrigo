#!/usr/bin/env node

/**
 * Sync Environment Variables from Root .env to Angular Environment Files
 *
 * This script reads STRIPE_PUBLISHABLE_KEY from root .env and
 * updates the Angular environment.ts and environment.prod.ts files.
 *
 * Run this script:
 * - Before starting development: npm run sync-env
 * - Before building for production: automatically runs in build script
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Path to root .env file
const rootEnvPath = path.resolve(__dirname, '../../.env');

// Paths to environment files
const envDevPath = path.resolve(__dirname, '../src/environments/environment.ts');
const envProdPath = path.resolve(__dirname, '../src/environments/environment.prod.ts');

/**
 * Parse .env file and extract key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Error: .env file not found at ${filePath}`, 'red');
    log(`\n💡 Run: cp .env.example .env`, 'yellow');
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    // Parse KEY=VALUE
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }
  });

  return envVars;
}

/**
 * Generate environment.ts content
 */
function generateEnvFileContent(isProduction, stripeKey) {
  return `export const environment = {
  production: ${isProduction},
  apiUrl: "/api",
  stripePublicKey: "${stripeKey}",
};
`;
}

/**
 * Main function
 */
function syncEnvironment() {
  log('\n🔄 Syncing environment variables from root .env...\n', 'cyan');

  // Parse root .env
  const envVars = parseEnvFile(rootEnvPath);

  // Extract Stripe publishable key
  const stripePublishableKey = envVars.STRIPE_PUBLISHABLE_KEY;

  if (!stripePublishableKey) {
    log('⚠️  Warning: STRIPE_PUBLISHABLE_KEY not found in .env', 'yellow');
    log('   Using placeholder value. Update .env with your Stripe key.', 'yellow');
  }

  const stripeKey = stripePublishableKey || 'pk_test_placeholder';

  // Generate environment files
  const devContent = generateEnvFileContent(false, stripeKey);
  const prodContent = generateEnvFileContent(true, stripeKey);

  // Write environment.ts
  fs.writeFileSync(envDevPath, devContent, 'utf8');
  log(`✅ Updated: ${path.relative(process.cwd(), envDevPath)}`, 'green');

  // Write environment.prod.ts
  fs.writeFileSync(envProdPath, prodContent, 'utf8');
  log(`✅ Updated: ${path.relative(process.cwd(), envProdPath)}`, 'green');

  // Display current values
  log('\n📋 Current Configuration:', 'cyan');
  log(`   Stripe Publishable Key: ${stripeKey.substring(0, 20)}...`, 'green');
  log(`   Production Mode: ${envVars.NODE_ENV === 'production'}`, 'green');

  log('\n✨ Environment sync complete!\n', 'green');
}

// Run the sync
try {
  syncEnvironment();
} catch (error) {
  log(`\n❌ Error syncing environment: ${error.message}`, 'red');
  process.exit(1);
}
