# Proteccio Interns

A privacy-first intern management platform built with Next.js, TypeScript, and Supabase.

## Features

### Core Platform
- **Intern Profile Management**: Complete profile lifecycle with approval workflows and status tracking
- **Role-Based Access Control**: Granular permissions for Admin, Intern, and Public roles
- **Data Governance**: Field-level classification (public/internal/confidential/sensitive) with visibility controls
- **Activity Logging**: Comprehensive audit trails for all system actions
- **Projects & Tasks**: Full project and task management with assignment tracking
- **Workflow Automation**: Rule-based automation engine with configurable triggers
- **Notifications System**: Real-time notifications for important events

### Productivity & Operational Governance
- **Attendance Tracking**: Check-in/check-out system with working hours calculation
- **Work Logs**: Daily work log submission with admin review workflow
- **Leave Management**: Leave request system with approval workflow
- **Task Events**: Comprehensive task lifecycle event tracking
- **Weekly Summaries**: Automated weekly performance summaries
- **Analytics Dashboard**: Real-time productivity metrics and trends

### Intern Lifecycle Management
- **Evaluation System**: 5-dimension performance evaluations (Task Quality, Consistency, Attendance, Communication, Learning) with automatic overall scoring
- **Lifecycle States**: Structured state management (Draft → Pending → Approved → Active → Completion Review → Completed/Extended/Terminated)
- **Certificate Generation**: Automated certificate data generation with Supabase Storage integration
- **Feedback System**: Multi-dimensional program feedback with analytics dashboard
- **Badge System**: Achievement badges with auto-assignment based on configurable criteria (Task Master, Consistent Performer, Early Finisher)
- **Comprehensive Reporting**: Detailed intern reports with attendance, tasks, skills, evaluations, badges, and feedback

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

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production (validates TypeScript and generates optimized build)
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run all tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Generate test coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:api` - Run API tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run end-to-end tests only

## Key Features Explained

### Lifecycle State Management

Interns progress through defined states with validation:

```
Draft → Pending → Approved → Active → Completion Review → Completed/Extended/Terminated
```

**State Transitions:**
- `draft` → `pending` (Submit for approval)
- `pending` → `approved` or `inactive` (Admin review)
- `approved` → `active` or `inactive` (Activation)
- `active` → `inactive`, `archived`, or `COMPLETION_REVIEW` (Status changes)
- `inactive` → `active`, `archived`, or `pending` (Reactivation)
- `COMPLETION_REVIEW` → `COMPLETED`, `EXTENDED`, or `TERMINATED` (Final decision)

### Evaluation System

5-dimension scoring (1-5 scale):
1. **Task Quality** - Quality of work delivered
2. **Consistency** - Reliability and consistency
3. **Attendance** - Attendance record
4. **Communication** - Communication skills
5. **Learning Progress** - Learning and growth

Overall score is automatically calculated as the average of all dimensions.

### Badge System

Auto-assigned badges based on criteria:
- **Task Master** - Complete 20+ tasks
- **Consistent Performer** - Maintain 90%+ attendance
- **Early Finisher** - Complete internship successfully

### Security Features

- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Role-Based Access Control**: Granular permissions per resource and action
- **Data Classification**: Field-level classification (public/internal/confidential/sensitive)
- **Activity Logging**: Comprehensive audit trails with categorization
- **Input Validation**: Zod schemas for all API inputs
- **Authentication**: Supabase Auth with SSR support

### Performance Optimizations

- **Image Optimization**: AVIF and WebP formats with 1-hour cache TTL
- **Static Asset Caching**: 1-year cache for static resources
- **Package Import Optimization**: Optimized imports for react-hot-toast
- **Compression**: Gzip/Brotli compression enabled
- **Pagination**: All list views support pagination
- **Turbopack**: Fast development builds with Next.js Turbopack

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router with Turbopack)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library
- **Validation**: Zod 4.3.6
- **Notifications**: React Hot Toast
- **Deployment**: Vercel-ready

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/              # Admin dashboard and management
│   │   │   ├── analytics/      # Productivity analytics
│   │   │   ├── completion-reviews/  # Intern completion workflow
│   │   │   ├── consent-logs/   # GDPR consent tracking
│   │   │   ├── dashboard/      # Main admin dashboard
│   │   │   ├── evaluations/    # Performance evaluations
│   │   │   ├── feedback-analytics/  # Feedback insights
│   │   │   ├── interns/        # Intern management
│   │   │   ├── leave/          # Leave request management
│   │   │   ├── reports/        # Comprehensive reporting
│   │   │   ├── worklogs/       # Work log review
│   │   │   └── ...             # Other admin features
│   │   ├── intern/             # Intern portal
│   │   │   ├── attendance/     # Check-in/check-out
│   │   │   ├── feedback/       # Program feedback
│   │   │   ├── leave/          # Leave requests
│   │   │   └── worklogs/       # Daily work logs
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── attendance/     # Attendance management
│   │   │   ├── evaluations/    # Evaluation endpoints
│   │   │   ├── feedback/       # Feedback collection
│   │   │   ├── badges/         # Badge management
│   │   │   ├── certificates/   # Certificate generation
│   │   │   ├── completion/     # Lifecycle management
│   │   │   ├── worklogs/       # Work log operations
│   │   │   └── ...             # Other API endpoints
│   │   ├── favicon.ico         # App favicon (App Router convention)
│   │   └── manifest.ts         # PWA manifest generator
│   ├── components/             # Reusable React components
│   │   ├── evaluations/        # Evaluation forms and history
│   │   ├── certificates/       # Certificate templates
│   │   ├── profile/            # Badge displays
│   │   ├── layout/             # Layout components (AppShell, Sidebar, etc.)
│   │   └── ui/                 # UI primitives
│   ├── lib/                    # Utility functions and core logic
│   │   ├── supabase/           # Supabase client configuration
│   │   ├── internWorkflow.ts  # Lifecycle state management
│   │   ├── logger.ts           # Activity logging
│   │   ├── permissions.ts     # RBAC utilities
│   │   ├── policyEngine.ts    # Policy evaluation
│   │   └── validations.ts     # Zod schemas
│   ├── services/               # Service layer for data operations
│   │   ├── badgeService.ts    # Badge logic
│   │   ├── certificateService.ts  # Certificate generation
│   │   ├── completionService.ts   # Lifecycle management
│   │   ├── evaluationService.ts   # Evaluation logic
│   │   ├── feedbackService.ts     # Feedback collection
│   │   └── reportService.ts       # Report generation
│   ├── modules/                # Feature modules
│   │   ├── notifications/      # Notification service
│   │   └── workflow/           # Workflow engine
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Centralized type exports
│   ├── context/                # React context providers
│   │   ├── AppContext.tsx      # Global app state
│   │   └── ConfigContext.tsx   # Configuration management
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.ts          # Authentication hook
│   └── __tests__/              # Test suites
│       ├── api/                # API route tests
│       ├── components/         # Component tests
│       ├── services/           # Service layer tests
│       └── integration/        # Integration tests
├── public/                     # Static assets (served from root)
│   ├── icon-192.png            # PWA icon 192x192 (add this)
│   ├── icon-512.png            # PWA icon 512x512 (add this)
│   └── README.md               # Instructions for static assets
└── .env.local                  # Environment variables (not in git)
```

## Database Setup

The database is already configured with the following tables:

### Core Tables
- `users` - User accounts with role assignments (admin/intern/public)
- `intern_profiles` - Intern information with lifecycle status tracking
- `projects` - Project data with tech stack and URLs
- `tasks` - Task management with assignment and status tracking
- `app_config` - Application configuration (key-value pairs)
- `activity_logs` - Comprehensive audit trail with categorization
- `notifications` - User notifications with read status
- `role_permissions` - RBAC permission matrix
- `workflow_rules` - Automation rule definitions
- `policies` - Data access policy engine
- `form_fields` - Dynamic form field configuration with visibility controls
- `consent_logs` - GDPR consent tracking

### Productivity & Governance Tables
- `attendance` - Check-in/check-out records with working hours
- `work_logs` - Daily work logs with review workflow
- `task_events` - Task lifecycle event tracking
- `leave_requests` - Leave request management with approval workflow
- `weekly_summary` - Automated weekly performance summaries

### Lifecycle Management Tables
- `intern_evaluations` - Performance evaluations with 5-dimension scoring
- `intern_feedback` - Program feedback from interns (4 rating categories)
- `badges` - Badge definitions with criteria
- `intern_badges` - Earned badges by interns
- `intern_lifecycle_summary` - Aggregated metrics view for reporting
- `intern_audit_log` - Intern-specific audit trail
- `intern_tasks` - Intern-specific task assignments
- `intern_documents` - Document management with verification
- `intern_skills` - Skill tracking with proficiency levels

### Storage Buckets
- `certificates` - Certificate files (private bucket with signed URLs)

### Key Database Fields

**intern_profiles table:**
- `status` - Lifecycle state (ACTIVE, COMPLETION_REVIEW, COMPLETED, EXTENDED, TERMINATED)
- `approval_status` - Approval state (pending, active, rejected)
- `is_active` - Boolean flag for active status
- `lifecycle_status` - Legacy field (deprecated, use `status` instead)

**app_config table:**
- `key` - Configuration key
- `value` - Configuration value
- `type` - Value type (string, boolean, color, json)
- `label` - Human-readable label

## Deployment

### Vercel Deployment (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Vercel will automatically:
- Detect Next.js configuration
- Run build process
- Set up preview deployments for PRs
- Enable automatic deployments on push

### Manual Deployment

For other platforms:

```bash
# Build the application
npm run build

# Start production server
npm start
```

Ensure environment variables are set in your hosting platform.

### Build Verification

Before deploying, verify the build:

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages (68/68)
✓ Finalizing page optimization
```

## Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all environment variables are set
- Check TypeScript errors: `npm run build`
- Verify Node.js version (20.19.0+)

**Database Connection:**
- Verify Supabase URL and anon key
- Check Supabase project status
- Ensure RLS policies are configured

**Authentication Issues:**
- Clear browser cookies and local storage
- Verify Supabase Auth is enabled
- Check user role assignments in database

**"Forbidden" Error on Admin Actions:**

This occurs when your authenticated user doesn't have an `admin` role in the `users` table.

**Quick Fix:**
1. Go to Supabase SQL Editor
2. Get your auth user ID:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```
3. Insert/update user with admin role:
   ```sql
   INSERT INTO users (id, email, role, created_at)
   VALUES ('your-user-id-from-above', 'your-email@example.com', 'admin', NOW())
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

**Automatic User Creation (Recommended):**

Create a database trigger to automatically create user records on signup:

```sql
-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'intern', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Then manually promote your user to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

**Verify Admin Setup:**
```sql
-- Check if user exists with correct role
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Ensure IDs match between auth.users and users tables
SELECT 
  au.id as auth_id, 
  au.email, 
  u.id as user_id, 
  u.role 
FROM auth.users au 
LEFT JOIN users u ON au.id = u.id 
WHERE au.email = 'your-email@example.com';
```

**Performance Issues:**
- Enable caching headers
- Optimize images
- Check database query performance
- Monitor Supabase usage limits

## Contributing

This is a private project. For internal development:

1. Create a feature branch
2. Make changes with proper TypeScript types
3. Write tests for new features
4. Run `npm run build` to verify
5. Submit PR for review

## Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Error Handling**: All async operations wrapped in try-catch
- **Validation**: Zod schemas for all API inputs
- **Testing**: Unit tests for services, integration tests for APIs
- **Security**: Input sanitization, RBAC checks, audit logging
- **Performance**: Pagination, efficient queries, caching

## Recent Updates

### Latest Fixes (Current Version)
- ✅ Fixed database column naming inconsistency in `app_config` table (config_key/config_value → key/value)
- ✅ Fixed intern status field inconsistency (lifecycle_status → status)
- ✅ Verified all 68 routes compile successfully
- ✅ Confirmed zero TypeScript errors
- ✅ Production-ready build validated

## License

This project is private and proprietary.

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**

For questions or support, contact the development team.
