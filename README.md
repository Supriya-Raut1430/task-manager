# 🚀 TaskFlow — Full-Stack Task Manager Web Application

A modern, responsive, real-world **Task Manager Web Application** built with **HTML, CSS, Vanilla JavaScript**, powered by a **Node.js + Express.js REST API** backend and **Supabase PostgreSQL** for persistent cloud database storage.

![TaskFlow Preview](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Node.js%20%7C%20Express%20%7C%20Supabase%20PostgreSQL-3ecf8e?style=for-the-badge)

---

## 📋 Table of Contents
- [✨ Features](#-features)
- [🛠️ Tech Stack & Dependencies](#️-tech-stack--dependencies)
- [📁 Project Architecture](#-project-architecture)
- [⚙️ Setup & Installation](#️-setup--installation)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone or Open Directory](#step-1-clone-or-open-directory)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Setup Supabase Database & Schema](#step-3-setup-supabase-database--schema)
  - [Step 4: Setup Environment Variables](#step-4-setup-environment-variables)
- [🚀 Running the Application](#-running-the-application)
- [📡 API Documentation](#-api-documentation)
- [🏗️ Stages of Implementation](#️-stages-of-implementation)
- [🔮 Future Enhancements](#-future-enhancements)

---

## ✨ Features

### 1. 📝 Complete Task Management (CRUD)
- **Add Task**: Create tasks with title, description, category, priority (`Low`, `Medium`, `High`), due date, and status (`Pending`, `In Progress`, `Completed`).
- **View Tasks**: Displayed as responsive, modern cards with color-coded priority borders, category tags, status badges, and formatted dates.
- **Edit Task**: Instant modal editor allowing live updates to any field.
- **Delete Task**: Safe deletion with a custom confirmation dialog to prevent accidental loss.
- **One-Click Toggle**: Mark tasks as completed or pending directly from the card checkbox or action button.
- **Completed Styling**: Visual strikethrough and muted presentation for completed tasks.

### 2. 📊 Real-Time Dashboard & Statistics
- Dynamic counters at the top:
  - **Total Tasks**
  - **Pending**
  - **In Progress**
  - **Completed**
  - **Overdue**
- Counters update instantly without requiring full page reloads.
- Clicking any stat card automatically filters the list to that status.

### 3. 🔍 Search, Filter & Sort
- **Live Search**: Debounced search across task title, description, and category via PostgreSQL queries.
- **Status Filters**: Quick filter pills for `All Tasks`, `Pending`, `In Progress`, `Completed`, and `⚠️ Overdue`.
- **Category Filter**: Filter tasks by categories (`College`, `Personal`, `Work`, `Coding`, `GATE`, `DSA`, `Other`, or user-created categories).
- **Custom Categories**: Users can dynamically type and save new categories.
- **Priority Filter**: High, Medium, Low.
- **Sorting Options**:
  - Newest First
  - Oldest First
  - Due Date (Earliest)
  - Priority (High to Low)
  - Alphabetical (A to Z)

### 4. ⏰ Overdue Detection
- Tasks are automatically marked as **Overdue** whenever:
  $$\text{Due Date} < \text{Current Date} \quad \text{AND} \quad \text{Status} \neq \text{"Completed"}$$
- Highlighted with an animated red badge and accent border.

### 5. 🌓 Dark / Light Mode
- Clean modern color schemes for both dark and light modes.
- Preference is saved permanently in `localStorage`.

### 6. 📱 100% Responsive Design
- Optimized for desktop, laptop, tablet, and mobile screens.
- Accessible modal dialogs with backdrop blur and escape-key handling.
- Non-blocking toast notifications for user feedback.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **HTML5**: Semantic tags, accessible attributes, and SVG iconography.
- **CSS3 (Vanilla)**: Design system variables, responsive CSS grid, flexbox, glassmorphism, micro-animations. No frontend UI frameworks.
- **JavaScript (ES6+ Vanilla)**: Native `fetch()` API, async/await, DOM manipulation, debounced search, modal handlers. No React/Vue/Angular.

### Backend
- **Node.js**: Asynchronous JavaScript runtime.
- **Express.js**: Fast, minimalist web framework for building REST APIs and serving static assets.
- **@supabase/supabase-js**: Official Supabase client for performing PostgreSQL operations and health checks.
- **dotenv**: Loads environment variables from `.env` into `process.env`.
- **cors**: Cross-Origin Resource Sharing middleware.
- **nodemon** *(Dev)*: Automatically restarts the server during development when files change.

---

## 📁 Project Architecture

```text
task manager/
├── server.js               # Main Express application & Supabase connection management
├── package.json            # Node.js dependencies and scripts
├── .env                    # Environment variables (PORT, SUPABASE_URL, SUPABASE_ANON_KEY)
├── .env.example            # Environment template for version control
├── .gitignore              # Files excluded from git (node_modules, .env)
├── supabase-schema.sql     # Complete PostgreSQL schema, triggers, indexes & RLS policies
├── README.md               # Complete project documentation
│
├── config/
│   └── supabase.js         # Supabase client initialization & health check probe
│
├── models/
│   └── Task.js             # Data model encapsulating Supabase queries & validation
│
├── controllers/
│   └── taskController.js   # Request handlers for task CRUD, stats & filtering
│
├── routes/
│   └── taskRoutes.js       # Express router mapping endpoints to controllers
│
└── public/                 # Client-side static files served by Express
    ├── index.html          # Semantic HTML page structure
    ├── style.css           # Vanilla CSS styles, themes & responsive design
    └── script.js           # Client-side state, fetch calls & DOM interactions
```

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have installed:
1. **Node.js** (v18 or higher recommended) — [Download Node.js](https://nodejs.org/)
2. A free **Supabase** account — [Supabase](https://supabase.com/)

### Step 1: Clone or Open Directory
```bash
cd "c:/Users/pawan/task manager"
```

### Step 2: Install Dependencies
Open the integrated terminal and run:
```bash
npm install
```

### Step 3: Setup Supabase Database & Schema
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. In the Supabase sidebar, click on **SQL Editor**.
3. Open `supabase-schema.sql` from this project, copy all its content, paste it into the Supabase SQL Editor, and click **Run**.
4. This script will automatically create:
   - The `tasks` table with UUID primary keys and timestamp fields
   - An auto-update trigger for `updated_at`
   - B-tree indexes for fast filtering and sorting
   - Row Level Security (RLS) policies allowing full client API access
   - Initial sample seed tasks for immediate testing

### Step 4: Setup Environment Variables
1. In your Supabase dashboard, go to **Project Settings** -> **API**.
2. Copy your **Project URL** and your **anon / public key**.
3. Create or update `.env` in the root directory:
```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
```

---

## 🚀 Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production / Standard Mode
```bash
npm start
```

Once started, open your browser and navigate to:
```
http://localhost:5000
```
The Express server serves both the **REST API backend** and the **Vanilla Frontend** simultaneously!

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api/tasks`

| Method | Endpoint | Description | Request Body / Query Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Get all tasks (supports query filtering) | `?search=term&status=Pending&priority=High&category=College&sortBy=dueDate` | `200`, `500` |
| **GET** | `/api/tasks/stats` | Get dashboard counters and category list | None | `200`, `500` |
| **GET** | `/api/tasks/:id` | Get a specific task by its UUID | None | `200`, `400`, `404` |
| **POST** | `/api/tasks` | Create a new task | `{ title, description, category, priority, status, dueDate }` | `201`, `400`, `500` |
| **PUT** | `/api/tasks/:id` | Update an existing task | `{ title, description, category, priority, status, dueDate }` | `200`, `400`, `404` |
| **DELETE**| `/api/tasks/:id` | Delete a task permanently | None | `200`, `400`, `404` |
| **PATCH** | `/api/tasks/:id/status`| Update only task status (`Pending`, `In Progress`, `Completed`) | `{ status: "Completed" }` | `200`, `400`, `404` |
| **GET** | `/api/health` | Health check endpoint returning database connection state | None | `200` |

---

## 🏗️ Stages of Implementation

### Stage 1: Basic Frontend
- Structured semantic HTML with modern SVG icons, card layout, and responsive containers.
- Implemented accessible modal dialogs for task creation/editing and confirmation for deletions.

### Stage 2: Express Backend
- Created an Express server in `server.js` configuring JSON middleware, CORS, and serving the `public` directory.
- Built organized modular architecture separating routes, controllers, models, and configuration.

### Stage 3: Supabase PostgreSQL Migration
- Migrated data layer from MongoDB/Mongoose to Supabase PostgreSQL.
- Authored production-ready SQL schema with triggers, indexes, and RLS policies in `supabase-schema.sql`.
- Built unified task formatting layer providing dual compatibility (`id` and `_id`, `dueDate` and `due_date`).

### Stage 4: CRUD Operations
- Implemented controller functions with `async/await`, input validation, and proper HTTP response codes.

### Stage 5: Frontend & Backend Communication (`fetch()`)
- Connected client-side buttons and forms to backend endpoints using native `fetch()`.
- Implemented real-time UI updates without full page reloads.

### Stage 6: Search, Filtering, Sorting & Dashboard Stats
- Built debounced search input, category filtering, priority filtering, and sort algorithms.
- Aggregated database counts for the dashboard cards.

### Stage 7: Dark Mode & Responsive Design
- Added CSS variables with smooth transitions for light and dark themes.
- Saved theme preference in `localStorage`.
- Media queries for smooth usability on mobile, tablet, and desktop screens.

---

## 🔮 Future Enhancements
- 🔒 **User Authentication**: Supabase Auth integration with Row Level Security per user.
- 🔔 **Task Reminders**: Browser push notifications for upcoming deadlines.
- 🔄 **Recurring Tasks**: Daily/weekly recurring tasks.
- 📊 **Productivity Charts**: Completion graphs using lightweight Chart.js or SVG bars.
