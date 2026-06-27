# ExportEase

ExportEase is a comprehensive platform for global trade and export solutions. This repository contains both the React frontend and the Express/Prisma backend.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (If you are using a local database. Alternatively, you can use a cloud database like Supabase).

---

## 1. Backend Setup

The backend is an Express.js server that uses Prisma ORM to connect to a PostgreSQL database.

### Installation
Open your terminal and navigate to the `backend` directory, then install the dependencies:

```bash
cd backend
npm install
```

### Environment Variables
Create a `.env` file inside the `backend/` directory and add the following variables. Replace the values with your actual database and authentication credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=5000
GOOGLE_CLIENT_ID="your_google_client_id_here"
```

### Database Setup
Once your `.env` file is set up, you need to push the database schema and generate the Prisma client. Run these commands inside the `backend` directory:

```bash
npx prisma db push
npx prisma generate
```

### Start the Backend
Start the backend server in development mode (which uses nodemon to auto-reload on changes):

```bash
npm run dev
```
The backend should now be running on `http://localhost:5000`.

---

## 2. Frontend Setup

The frontend is a React application built with Vite.

### Installation
Open a *new* terminal window (leave the backend running), navigate to the root directory of the project, and install the dependencies:

```bash
# Make sure you are in the root directory (not the backend directory)
npm install
```

### Environment Variables
Create a `.env` file inside the root directory and add your Google Client ID (this must match the one used in the backend):

```env
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
VITE_BACKEND_URL="http://localhost:5000"
```

### Start the Frontend
Start the Vite development server:

```bash
npm run dev
```

The frontend should now be running. You can access the application by opening your browser and navigating to `http://localhost:5173` (or whatever port Vite provides in your terminal).

---

## Project Structure

- `/src` - Contains the React frontend code (Pages, Components, UI elements).
- `/backend` - Contains the Express server, Prisma schema, and API routes.
  - `/backend/prisma/schema.prisma` - The database schema definitions.
  - `/backend/server.js` - The main entry point for the backend API.

## Notes
- **File Uploads:** Profile pictures and generated documents are stored directly in the PostgreSQL database using the `UploadedFile` table. This ensures files are never lost when deploying to serverless platforms like Render or Vercel.
- **Authentication:** The app uses JWT for custom email/password authentication and also supports Google OAuth.
