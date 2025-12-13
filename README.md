# Vwaza MVP

A music distribution platform MVP connecting artists with admin reviewers.

## 🚀 Quick Start (Local Development)

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL (Local instance running)

### Setup & Run
I have provided an automated setup script to install dependencies and initialize the database.

1.  **Clone the repository** (if not already done).
2.  **Configure Environment**:
    -   Create file in `backend/.env` with the following:
        ```env
        DATABASE_URL=postgres://postgres:password@localhost:5432/vwaza_mvp
        JWT_SECRET=supersecretlengthykey
        PORT=3000
        CLOUDINARY_URL=cloudinary://<cloudinary_api_key>:<cloudinary_api_secret>@<cloudinary_api_name>

        ```
        *(Adjust `postgres:password` to your local DB credentials)*.
3.  **Run Setup**:
    ```bash
    npm run setup
    ```
    *This will install dependencies for both frontend/backend and run database migrations.*
4.  **Start the App**:
    ```bash
    npm run dev
    ```
    *This runs both the Backend (port 3000) and Frontend (port 5173).*

---

## 🏗️ Architecture Decisions

### Structure: Monorepo-ish
I chose a simple split folder structure (`frontend/` and `backend/`) within a single root.
*   **Why?**: Keeps concerns separated while allowing easy codebase navigation for a single developer. It avoids the complexity of full monorepo tools (Nx/Turbo) for this MVP stage.

### Frontend: Vite + React
*   **Why?**: Vite offers instant dev server starts, making iteration extremely fast. React is the industry standard for interactive UIs.
*   **Auth**: JWT stored in `localStorage`.
    *   *Decision*: Simple to implement for MVP. Stateless backend scales well.

### Backend: Fastify + PostgreSQL
*   **Why Fastify?**: Better performance than Express and easier async/await handling.
*   **Why PostgreSQL?**: Reliable, relational data model fits the structured nature of Releases, Tracks, and Users.
*   **Auth**: `@fastify/jwt` for handling token verification.

### UI/UX
*   **Artist Dashboard**: Designed with a "Solitaire-style" stacking card interface to gamify the library management.
*   **Admin Dashboard**: Kanban-style board for efficient flow-based review process.
*   **Styling**: TailwindCSS for rapid UI development and consistent design tokens.

---

## ⚖️ Trade-offs & Shortcuts

1.  **Database Access**:
    *   *Shortcut*: Used `pg` driver with raw SQL queries instead of an ORM (Prisma/TypeORM).
    *   *Implication*: Faster initial setup and no ORM overhead, but less type-safety for database schemas and harder refactoring later.

2.  **Authentication**:
    *   *Shortcut*: Basic JWT implementation without Refresh Tokens.
    *   *Implication*: Users stay logged in until the token expires, then must re-login. No silent refresh mechanism.

3.  **Real-time Updates**:
    *   *Shortcut*: Polling (every 5 seconds) instead of WebSockets.
    *   *Implication*: Simpler implementation (no socket server maintenance), but slightly higher network traffic and ~5s latency on updates.

4.  **Validation**:
    *   *Shortcut*: Basic manual validation logic.
    *   *Implication*: A library like `zod` would be more robust for production.
