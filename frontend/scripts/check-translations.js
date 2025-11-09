#!/usr/bin/env node

/**
 * Translation Completeness Checker
 *
 * This script verifies that all translation files have the same keys
 * and reports any missing or extra keys.
 */

const fs = require('fs');
const path = require('path');

const languages = ['pt', 'es', 'en'];
const i18nDir = path.join(__dirname, '../src/assets/i18n');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Load translation file
 */
function loadTranslations(lang) {
  const filePath = path.join(i18nDir, `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${lang}.json: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Get all keys from an object (nested)
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Main function
 */
function checkTranslations() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}Translation Completeness Check${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  // Load base translation (Portuguese)
  const baseTranslation = loadTranslations('pt');
  if (!baseTranslation) {
    console.error(`${colors.red}Failed to load base translation (pt.json)${colors.reset}`);
    process.exit(1);
  }

  const baseKeys = new Set(getAllKeys(baseTranslation));
  console.log(`${colors.blue}Base language (pt):${colors.reset} ${baseKeys.size} keys\n`);

  let hasErrors = false;

  // Check each language
  languages.forEach(lang => {
    const translation = loadTranslations(lang);
    if (!translation) {
      hasErrors = true;
      return;
    }

    const langKeys = new Set(getAllKeys(translation));
    const missing = [...baseKeys].filter(k => !langKeys.has(k));
    const extra = [...langKeys].filter(k => !baseKeys.has(k));

    console.log(`${colors.blue}Language: ${lang}${colors.reset}`);
    console.log(`  Total keys: ${langKeys.size}`);

    if (missing.length > 0) {
      hasErrors = true;
      console.log(`  ${colors.red}Missing keys (${missing.length}):${colors.reset}`);
      missing.forEach(key => {
        console.log(`    ${colors.red}✗${colors.reset} ${key}`);
      });
    }

    if (extra.length > 0) {
      hasErrors = true;
      console.log(`  ${colors.yellow}Extra keys (${extra.length}):${colors.reset}`);
      extra.forEach(key => {
        console.log(`    ${colors.yellow}⚠${colors.reset} ${key}`);
      });
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ${colors.green}✓ Complete${colors.reset}`);
    }

    console.log('');
  });

  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (hasErrors) {
    console.log(`${colors.red}Translation check failed!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}All translations are complete!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run the check
checkTranslations();
