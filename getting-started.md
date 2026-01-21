# Getting Started with "Solitaire Stack"

Welcome to the React + Fastify Starter Kit featuring the unique "Solitaire" stacking interface.

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm run setup
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    This launches both Backend (port 3000) and Frontend (port 5173).

## Key Features

### 1. Card Stack UI (`<CardStack />`)
A unique way to visualize lists of items. Stacks are collapsed by default via CSS transforms and expand into a grid when clicked.
- **Usage**: See `frontend/src/components/CardStack.tsx`
- **Demo**: `frontend/src/pages/DemoDashboard.tsx`

### 2. Kanban Board (`<KanbanBoard />`)
A clean, motion-animated Kanban board for task management.
- **Usage**: `frontend/src/components/KanbanBoard.tsx`

### 3. Fastify Backend
A pre-configured Fastify server with:
- JWT Authentication (`@fastify/jwt`)
- Postgres Database connection (`pg`)
- Generic "Item" resource (`routes/items.ts`)

## Customization

### Theming
The project uses TailwindCSS. Edit `frontend/src/index.css` or `tailwind.config.js` to change the color palette.

### Adding Resources
1.  Create a model in `backend/src/models/`.
2.  Create a controller in `backend/src/controllers/`.
3.  Register routes in `backend/src/app.ts`.

## Deployment
Check `frontend/vercel.json` for frontend deployment configuration. Backend can be deployed to any Node.js host (Render, Railway, etc.).
