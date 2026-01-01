# 가평군 업무보고 시스템

## Overview
이 시스템은 가평군 공무원들을 위한 주간 업무보고서 작성 및 관리 시스템입니다. React + Express + PostgreSQL 스택을 사용하여 구축되었으며, Firebase를 통한 Google 인증과 shadcn/ui 컴포넌트를 활용한 현대적인 UI를 제공합니다.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with TypeScript support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Database**: Firebase Firestore for cloud data storage
- **Middleware**: Custom logging and error handling
- **Development**: Hot reload with Vite dev server integration

### Authentication System
- **Provider**: Firebase Authentication
- **Method**: Email/Password authentication with registration
- **Session Management**: Firebase session tokens
- **Authorization**: Role-based access (employee/admin)
- **Registration**: New users can create accounts with department selection

## Key Components

### Database Schema (Drizzle ORM)
- **users**: Stores user profiles with Firebase UID mapping
- **reports**: Weekly reports with approval workflow
- **Fields**: Comprehensive report structure with budget tracking
- **Relationships**: User-to-reports one-to-many relationship

### Report Management System
- **Creation**: Form-based report creation with validation
- **Workflow**: Draft → Pending → Approved/Rejected states
- **Time Tracking**: Weekly period calculation and management
- **File Attachments**: JSON-based file metadata storage

### UI Component System
- **Design System**: shadcn/ui with "new-york" style variant
- **Components**: 40+ pre-built components (forms, tables, modals)
- **Theming**: CSS custom properties with light/dark mode support
- **Responsive**: Mobile-first design with breakpoint utilities

### Admin Dashboard
- **User Management**: User role assignment and department management
- **Report Review**: Approval/rejection workflow with comments
- **Analytics**: Department-wise statistics and reporting

## Data Flow

### Authentication Flow
1. User clicks Google login → Firebase redirect
2. Firebase returns with user token
3. Frontend syncs user data with backend
4. Backend creates/updates user record
5. User profile loaded for role-based navigation

### Report Creation Flow
1. User accesses report form
2. Form auto-populates user data and current week
3. User fills report sections with validation
4. Save as draft or submit for review
5. Admin reviews and approves/rejects
6. User receives notification of status change

### Data Synchronization
- TanStack Query manages server state caching
- Optimistic updates for better UX
- Automatic cache invalidation on mutations
- Error boundaries for graceful failure handling

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Authentication**: Firebase Auth
- **UI Library**: Radix UI primitives
- **Validation**: Zod schema validation
- **Date Handling**: date-fns with Korean locale

### Development Tools
- **Build**: Vite with React plugin
- **Runtime**: tsx for TypeScript execution
- **Bundling**: esbuild for production server build
- **Linting**: TypeScript compiler checking

### UI Enhancement
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS with PostCSS
- **Components**: class-variance-authority for variant styling
- **Animations**: Built-in Tailwind animations

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server to `dist/index.js`
3. **Assets**: Static files served from build output
4. **Database**: Drizzle migrations applied on deployment

### Environment Configuration
- **Development**: tsx with hot reload via Vite
- **Production**: Node.js serving bundled application
- **Database**: Connection via DATABASE_URL environment variable
- **Firebase**: Configuration via environment variables

### Replit Deployment
- **Platform**: Replit autoscale deployment
- **Port**: Application runs on port 5000, exposed on port 80
- **Database**: PostgreSQL 16 module integrated
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## Changelog
- June 18, 2025. Initial setup
- June 18, 2025. Changed authentication from Google OAuth to email/password system
- June 18, 2025. Added admin/employee role selection during registration
- June 18, 2025. Updated department list to actual Gapyeong Facilities Management Corporation departments
- June 18, 2025. Integrated Firebase Firestore for cloud data storage - users and reports now stored in Firebase
- June 18, 2025. Added password reset functionality using Firebase Auth sendPasswordResetEmail feature
- June 18, 2025. Fixed syntax errors in Sidebar component JSX structure that prevented app startup
- June 18, 2025. Added report selection and batch download functionality to admin dashboard
- June 18, 2025. Removed duplicate "보고서 작성" button from sidebar menu
- June 18, 2025. Enhanced download functionality: single file downloads original attachment, multiple files download as ZIP with JSZip library

## User Preferences
Preferred communication style: Simple, everyday language.