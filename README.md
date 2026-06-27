# 🌐 ExportEase

![ExportEase Banner](https://via.placeholder.com/1200x300.png?text=ExportEase+-+Global+Trade+%26+Export+Solutions)

**ExportEase** is a comprehensive, modern platform designed to streamline global trade and export solutions. It provides an intuitive interface for managing shipments, estimating costs, generating proforma and commercial invoices, and tracking export statuses in real-time.

---

## 🚀 Technology Stack

This project is built using a modern full-stack JavaScript architecture.

### **Frontend (Client-Side)**
- **Framework:** [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/) for lightning-fast development.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) for highly customizable, utility-first styling.
- **Routing:** [React Router v7](https://reactrouter.com/) for seamless navigation.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) for fluid and professional micro-animations.
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives for accessible, unstyled components.
- **Icons:** [Lucide React](https://lucide.dev/) for crisp, modern iconography.
- **Authentication:** `@react-oauth/google` for secure Google Sign-in integration.
- **HTTP Client:** `axios` for communicating with the backend API.

### **Backend (Server-Side)**
- **Framework:** [Express.js](https://expressjs.com/) on Node.js.
- **Database ORM:** [Prisma](https://www.prisma.io/) for type-safe database access.
- **Database:** [PostgreSQL](https://www.postgresql.org/).
- **Security:** `jsonwebtoken` (JWT) for authentication and `bcryptjs` for password hashing.
- **File Handling:** `multer` for handling multipart/form-data (file uploads).
- **Document Generation:** `pdfkit` for generating dynamic, professional PDFs on the fly.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following software installed on your local machine:

1. **Node.js (v18 or higher)** - [Download Node.js](https://nodejs.org/). 
   *(Note: Installing Node.js automatically installs `npm`, which is required to download the project's libraries).*
2. **PostgreSQL** - [Download PostgreSQL](https://www.postgresql.org/download/).
   *(You can use a local installation or a cloud provider like Supabase/Neon).*

---

## 💻 Local Development Setup

Follow these exact steps to run the project locally on your machine.

### Step 1: Clone the Repository
Extract the project files or clone the repository to your local machine, then open the folder in your code editor (like VS Code).

---

### Step 2: Setup & Run the Backend

You must start the backend server first so the frontend has an API to connect to.

1. **Open a terminal** and navigate into the backend folder:
   ```bash
   cd backend
   ```

2. **Download Required Libraries:** Run the following command to install all the backend dependencies (Express, Prisma, PDFKit, etc.):
   ```bash
   npm install
   ```

3. **Configure Environment Variables:** Create a file named `.env` inside the `backend` folder and add your credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   JWT_SECRET="your_super_secret_jwt_key_here"
   PORT=5000
   GOOGLE_CLIENT_ID="your_google_client_id_here"
   ```

4. **Sync the Database:** Push the Prisma schema to your PostgreSQL database to create the necessary tables, then generate the Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Backend Server:**
   ```bash
   npm run dev
   ```
   *You should see a message confirming the server is running on port 5000.*

---

### Step 3: Setup & Run the Frontend

With the backend running, open a **second, separate terminal** to start the frontend.

1. **Ensure you are in the root directory** of the project (not the backend folder).

2. **Download Required Libraries:** Run the following command to install all frontend dependencies (React, Tailwind, Framer Motion, etc.):
   ```bash
   npm install
   ```

3. **Configure Environment Variables:** Create a file named `.env` inside the root folder (alongside `package.json`):
   ```env
   VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
   VITE_BACKEND_URL="http://localhost:5000"
   ```

4. **Start the Frontend Application:**
   ```bash
   npm run dev
   ```

5. **View the Application:** Open your web browser and navigate to the URL provided in your terminal (usually `http://localhost:5173`).

---

## 📁 Project Architecture Details

- **Database-Backed File Storage:** To ensure compatibility with serverless hosting platforms (like Render or Vercel), all generated PDFs and uploaded profile pictures are stored securely as binary data inside the PostgreSQL database (in the `UploadedFile` table). This prevents data loss during server restarts.
- **Protected Routes:** The application uses React Router to enforce secure, authenticated access. Attempting to visit dashboard pages without a valid JWT token will automatically redirect users to the login screen.
- **Dynamic Cost Estimator:** The backend contains a robust calculation engine that factors in shipping type (air/sea), product category, and destination tariffs to provide accurate export cost estimates.
