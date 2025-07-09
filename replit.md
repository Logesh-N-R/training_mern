# Daily Training Test App

## Overview

This is a full-stack web application called "Daily Training Test App" built with React (frontend) and Node.js with Express (backend). The app manages daily training test forms with different user roles: trainees, admins, and super admins. The system uses file-based storage with JSON files for data persistence and includes JWT-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Google OAuth Setup

To enable Google Single Sign-On (SSO):

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add your redirect URI: `https://your-repl-name.your-username.repl.co/api/auth/google/callback`
7. Copy your Client ID and Client Secret
8. Add them to your Replit Secrets:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `GOOGLE_REDIRECT_URI`: Your redirect URI (optional, defaults to localhost for development)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build process
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API for authentication, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API**: RESTful API structure
- **Middleware**: Custom authentication and role-based access control

### Data Storage
- **Primary Storage**: MongoDB database with native MongoDB driver
- **Database Driver**: MongoDB native driver (migrated from PostgreSQL)
- **Database Collections**: 
  - `users` - User accounts and roles with ObjectId references
  - `questions` - Test questions organized by date/session with creator references
  - `submissions` - Test submissions and answers with ObjectId relationships

## Key Components

### Authentication System
- JWT token-based authentication
- Role-based access control (trainee, admin, superadmin)
- Automatic super admin creation on first run
- Password hashing with bcrypt

### User Roles & Permissions
- **Trainee**: Can take tests, view own submissions
- **Admin**: Can manage questions, view all submissions, manage trainees
- **Super Admin**: Full system access, can manage admin accounts

### Test Management
- Daily test forms with auto-loading by date
- Question sets with topics and questions
- Answer submission with understanding levels
- Status tracking (Completed, In Progress, etc.)

### Question Management
- Admin can upload question sets for specific dates
- Questions organized by session title and topic
- Duplicate date prevention
- Question editing and deletion capabilities

## Data Flow

1. **User Authentication**: Login → JWT token → Role-based route access
2. **Question Loading**: Date-based question retrieval for daily tests
3. **Test Submission**: Form data → Validation → JSON file storage
4. **Admin Dashboard**: Aggregated data display from all JSON files
5. **Super Admin Panel**: User management and system overview

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router alternative)
- UI Components: Radix UI primitives with shadcn/ui
- Form handling: React Hook Form with Hookform resolvers
- HTTP client: Built-in fetch with TanStack Query
- Styling: Tailwind CSS with class-variance-authority

### Backend Dependencies
- Express.js for server framework
- JWT for authentication tokens
- bcrypt for password hashing
- Zod for schema validation
- File system operations for JSON storage

### Development Dependencies
- Vite for development server and build
- TypeScript for type safety
- ESLint and Prettier for code quality
- Replit-specific plugins for development environment

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Node.js server with tsx for TypeScript execution
- File-based storage in local `server/data/` directory
- Replit-specific development tools and overlays

### Production Build
- Frontend: Vite build to `dist/public/`
- Backend: esbuild bundle to `dist/index.js`
- Static file serving from Express
- Environment variables for configuration

### Database Migration Path
- Current: File-based JSON storage
- Future: Drizzle ORM with PostgreSQL
- Migration strategy: JSON to SQL data transformation
- Schema defined in `shared/schema.ts` for future database use

### File Storage Structure
```
server/data/
├── users.json          # User accounts and authentication
├── questions.json      # Test questions by date/session
└── submissions.json    # Test answers and submissions
```

### Security Considerations
- JWT tokens with 24-hour expiration
- Role-based route protection
- Password hashing with bcrypt
- Input validation with Zod schemas
- CORS and security headers via middleware

### Mobile Responsiveness
- Tailwind CSS responsive design system
- Mobile-first approach with breakpoint utilities
- Touch-friendly UI components
- Responsive navigation and layouts