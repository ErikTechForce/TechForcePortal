# TechForcePortal

A modern dashboard portal for TechForce Robotics with a green and white color scheme.

## Features

- **Dashboard Page**: Clean and modern interface
- **Header**: Displays TechForce Robotics company name
- **Sidebar Menu**: Navigation menu with the following categories:
  - Dashboard
  - Tasks Board
  - Client
  - Inventory
  - Robots
  - Setting (separated at the bottom)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (for database)

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Set up the database:**
   - Make sure PostgreSQL is installed and running
   - Create the database: `CREATE DATABASE techforce_portal;`
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions

3. **Set up the backend server:**
```bash
# Install backend dependencies
npm run server:install

# Create .env file with your database credentials
cd server
npm run setup-env
# Or manually create server/.env file (see server/SETUP.md)
```

4. **Start the development servers:**
```bash
# Option 1: Run both frontend and backend (requires concurrently)
npm run dev

# Option 2: Run separately in different terminals
npm start              # Frontend (port 3000)
npm run server         # Backend (port 3001)
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app in the browser.

## Tech Stack

### Frontend
- React 18
- TypeScript
- React Router
- CSS3
- PDF-lib (for contract generation)

### Backend
- Node.js
- Express
- PostgreSQL
- TypeScript

## Project Structure

```
TechForcePortal/
├── src/                 # React frontend application
├── server/              # Backend API server
│   ├── src/
│   │   ├── config/     # Database configuration
│   │   ├── routes/     # API routes
│   │   └── index.ts    # Server entry point
│   └── package.json
└── package.json        # Root package.json
```

## Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.

## Backend API

The backend server runs on `http://localhost:3001` and provides:

- `GET /api/health` - Health check and database connection status
- `GET /api/db-info` - Database information

More API endpoints will be added as you create tables and implement features.