# Proteccio Interns

A privacy-first intern management platform built with Next.js, TypeScript, and Supabase.

## Features

- Intern profile management with approval workflows
- Role-based access control (Admin, Intern, Public)
- Data governance and privacy controls
- Activity logging and audit trails
- Projects and tasks management
- Workflow automation
- Notifications system

## Prerequisites

- Node.js 20.19.0 or higher
- npm 10.1.0 or higher
- Supabase account

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aijpazkdxaexvlpkvcpw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest

## Tech Stack

- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library
- **Validation**: Zod

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable React components
│   ├── lib/              # Utility functions and core logic
│   ├── services/         # Service layer for data operations
│   ├── modules/          # Feature modules
│   ├── types/            # TypeScript type definitions
│   └── context/          # React context providers
├── public/               # Static assets
└── .env.local           # Environment variables (not in git)
```

## Database Setup

You need to set up the following tables in your Supabase project:

- `users` - User accounts with roles
- `intern_profiles` - Intern information
- `projects` - Project data
- `tasks` - Task management
- `app_config` - Application configuration
- `activity_logs` - Audit trail
- `notifications` - User notifications
- `role_permissions` - RBAC permissions
- `workflow_rules` - Automation rules
- `policies` - Data access policies

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

This project is private and proprietary.
