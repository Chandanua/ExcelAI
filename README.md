# ExcelAI

ExcelAI is a complete automation system that bridges the gap between your Excel spreadsheets and personalized email campaigns. It watches your Excel files for changes, generates customized emails using AI, automatically sends them, and tracks opens and clicks—all in real-time.

## Features

- **Real-Time Excel Watching** — Automatically detect new and updated rows in your Excel files.
- **AI-Powered Email Generation** — Generate personalized emails using OpenAI or local Ollama models.
- **Multi-Channel Sending** — Send via Gmail API or SMTP with support for attachments and HTML templates.
- **Email Open Tracking** — Track opens with pixel tracking and clicks with link tracking.
- **Follow-Up Sequences** — Build automated follow-up sequences with customizable delays.
- **Double-Send Prevention** — Smart deduplication prevents accidentally sending to the same person twice.

## Project Structure

```
ExcelAI/
├── EX-frontend/          # React SPA (Vite + TailwindCSS)
│   ├── src/
│   │   ├── pages/        # Route components (Index, Dashboard)
│   │   ├── components/   # UI component library (Radix UI)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   ├── App.tsx       # App entry with routing
│   │   └── global.css    # TailwindCSS theme
│   ├── public/           # Static assets (logo, robots.txt)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── EX-backend/           # Express API Server
│   ├── src/
│   │   ├── routes/       # API endpoints (automation, tracking)
│   │   ├── services/     # Business logic (email, excel, AI)
│   │   ├── utils/        # Logger and utilities
│   │   ├── shared/       # Shared types
│   │   └── index.ts      # Server entry point
│   ├── data/             # Excel data files
│   ├── .env              # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Tech Stack

### Frontend
- React 18, React Router 6, TypeScript, Vite
- TailwindCSS 3, Radix UI, Lucide React icons, Framer Motion

### Backend
- Express, TypeScript, Nodemailer, Multer, xlsx

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm package manager

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ExcelAI
   ```

2. **Install frontend dependencies:**
   ```bash
   cd EX-frontend
   pnpm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd EX-backend
   pnpm install
   ```

4. **Configure environment variables:**
   Edit `EX-backend/.env` with your SMTP credentials, AI API keys, and other settings.

### Running in Development

Start the backend and frontend in **separate terminals**:

```bash
# Terminal 1 — Backend (port 3000)
cd EX-backend
pnpm dev

# Terminal 2 — Frontend (port 5173)
cd EX-frontend
pnpm dev
```

The frontend dev server automatically proxies `/api/*` requests to the backend.

### Building for Production

```bash
# Build frontend
cd EX-frontend
pnpm build

# Build backend
cd EX-backend
pnpm build

# Start production server (serves both API and frontend)
cd EX-backend
pnpm start
```

## How It Works

1. **Upload Your Excel File** — Place your `leads.xlsx` file in `EX-backend/data/` or upload through the dashboard.
2. **Configure AI Model** — Choose OpenAI or Ollama as your AI engine.
3. **Design Email Template** — Create responsive HTML emails with dynamic variables.
4. **Set Up Email Service** — Configure Gmail API or SMTP credentials.
5. **Enable Open Tracking** — Tracking pixels are automatically injected into your emails.
6. **Monitor & Optimize** — View real-time stats on sent emails, open rates, and engagement.

## License

Copyright © 2024 ExcelAI. All rights reserved.
