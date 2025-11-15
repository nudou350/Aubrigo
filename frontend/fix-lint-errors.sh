#!/usr/bin/env bash
# Script to automatically fix common ESLint errors

# Fix unused error variables by adding underscore prefix
find src/app -type f -name "*.ts" -exec sed -i 's/catch (error)/catch (_error)/g' {} \;
find src/app -type f -name "*.ts" -exec sed -i 's/catch (err)/catch (_err)/g' {} \;
find src/app -type f -name "*.ts" -exec sed -i 's/catch (e)/catch (_e)/g' {} \;

# Note: Cannot automatically fix empty blocks and accessibility issues
# These require manual intervention
echo "Fixed unused error variable names"
echo "Remaining issues require manual fixes:"
echo "1. Empty catch blocks"
echo "2. Accessibility attributes"
echo "3. Type safety (any types)"
