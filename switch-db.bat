@echo off
REM Auto-switch database based on git branch
REM Run this after switching branches: npm run switch-db

echo Detecting current git branch...
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

echo Current branch: %BRANCH%

if "%BRANCH%"=="main" (
    echo Switching to MAIN database: aubrigo
    powershell -Command "$content = Get-Content .env; $content -replace 'DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/.*', 'DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/aubrigo' | Set-Content .env"
    echo Done! Using database: aubrigo
) else if "%BRANCH%"=="dev" (
    echo Switching to DEV database: aubrigo_dev
    powershell -Command "$content = Get-Content .env; $content -replace 'DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/.*', 'DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/aubrigo_dev' | Set-Content .env"
    echo Done! Using database: aubrigo_dev
) else (
    echo Warning: Unknown branch '%BRANCH%'
    echo Using current database configuration
)

pause
