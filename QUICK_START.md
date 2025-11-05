# Quick Start Guide - Pet SOS

## Starting the Application

You have **three options** to start both frontend and backend simultaneously:

### Option 1: Windows Batch Script (Recommended for Windows)

Double-click `start.bat` or run in terminal:

```batch
start.bat
```

This will:
- Automatically install dependencies if needed
- Start backend on http://localhost:3000
- Start frontend on http://localhost:4200
- Open two separate command windows for monitoring

### Option 2: Shell Script (Linux/Mac)

```bash
./start.sh
```

This will:
- Automatically install dependencies if needed
- Start both services in a single terminal
- Display output from both services
- Press `Ctrl+C` to stop both

### Option 3: NPM Scripts (Cross-platform)

```bash
npm start
```

Available npm scripts:
- `npm start` - Start both frontend and backend
- `npm run start:backend` - Start only backend
- `npm run start:frontend` - Start only frontend
- `npm run install:all` - Install all dependencies (backend + frontend)
- `npm run build:all` - Build both projects
- `npm run lint:all` - Lint both projects

---

## First Time Setup

1. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rescue-me
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```
   Or let the start script do it automatically.

4. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `backend` and `frontend` folders
   - Update with your configuration

5. **Set up the database**
   ```bash
   cd backend
   npm run migration:run
   npm run seed
   cd ..
   ```

6. **Start the application**
   - Windows: `start.bat`
   - Linux/Mac: `./start.sh`
   - Or: `npm start`

---

## Default URLs

After starting:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Backend API Docs**: http://localhost:3000/api/docs (if Swagger is enabled)

---

## Stopping the Application

### Windows (using start.bat):
- Close the two command windows that opened
- Or press `Ctrl+C` in each window

### Linux/Mac (using start.sh):
- Press `Ctrl+C` in the terminal

### Using npm start:
- Press `Ctrl+C` in the terminal

---

## Troubleshooting

### Port Already in Use

If you get an error about ports 3000 or 4200 being in use:

**Windows:**
```batch
npx kill-port 3000
npx kill-port 4200
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:4200 | xargs kill -9
```

### Dependencies Not Installing

Try installing manually:
```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### Database Connection Issues

1. Make sure PostgreSQL is running
2. Check your `.env` file in the backend folder
3. Verify database credentials
4. Run migrations: `cd backend && npm run migration:run`

---

## Development Workflow

1. Start the application: `npm start`
2. Make changes to code
3. Changes auto-reload (hot reload enabled)
4. Test your changes at http://localhost:4200

### Running Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

---

## Building for Production

```bash
npm run build:all
```

Or separately:
```bash
cd backend && npm run build
cd frontend && npm run build --configuration production
```

---

## Additional Commands

### Database Operations

```bash
cd backend

# Generate migration
npm run migration:generate -- MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed database
npm run seed
```

### Code Quality

```bash
# Lint all code
npm run lint:all

# Format code (if Prettier is configured)
cd backend && npm run format
cd frontend && npm run format
```

---

## Need Help?

- Check the main [README.md](README.md)
- Review [CLAUDE.md](CLAUDE.md) for detailed documentation
- Create an issue on GitHub
- Contact the development team

---

**Happy Coding! 🐾**
