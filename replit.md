
# Daily Training Test App

## Overview

This is a full-stack web application called "Daily Training Test App" built with React (frontend) and Node.js with Express (backend). The app manages daily training test forms with different user roles: trainees, admins, and super admins. The system has migrated to MongoDB for data persistence and includes JWT-based authentication with Google OAuth integration.

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
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and build process
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API for authentication, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for smooth interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing, Google OAuth integration
- **API**: RESTful API structure
- **Middleware**: Custom authentication and role-based access control
- **Session Management**: Express sessions with memory store

### Data Storage
- **Primary Storage**: MongoDB database with native MongoDB driver
- **Database Collections**: 
  - `users` - User accounts and roles with ObjectId references
  - `questions` - Test questions organized by date/session with creator references
  - `submissions` - Test submissions and answers with ObjectId relationships
- **Migration**: Automated migration from JSON file storage to MongoDB

## Key Features

### Authentication System
- JWT token-based authentication with 24-hour expiration
- Google OAuth Single Sign-On integration
- Role-based access control (trainee, admin, superadmin)
- Automatic super admin creation on first run
- Password hashing with bcrypt
- Session management for persistent login

### User Roles & Permissions
- **Trainee**: Can take tests, view own submissions, submit remarks
- **Admin**: Can manage questions, view all submissions, evaluate submissions, manage trainees
- **Super Admin**: Full system access, can manage admin accounts, system overview

### Test Management
- Daily test forms with auto-loading by date
- Question sets with topics and questions organized by session
- Answer submission with understanding levels and status tracking
- Multiple-choice and text-based questions support
- Submission evaluation with scoring and feedback system
- Status tracking (Completed, In Progress, Pending Evaluation)

### Question Management
- Admin can upload question sets for specific dates via Excel/CSV import
- Questions organized by session title and topic
- Duplicate date prevention with override options
- Question editing and deletion capabilities
- Bulk question import with validation

### Submission Management
- Real-time submission tracking and evaluation
- Score calculation with percentage grading
- Individual question feedback and scoring
- Overall submission feedback and remarks
- Submission history and analytics

### Dashboard Features
- **Trainee Dashboard**: Personal test history, upcoming tests, submission status
- **Admin Dashboard**: Submission management, question upload, user analytics
- **Super Admin Panel**: User management, system statistics, role assignments

## Data Flow

1. **User Authentication**: Login → JWT token → Role-based route access
2. **Question Loading**: Date-based question retrieval for daily tests
3. **Test Submission**: Form data → Validation → MongoDB storage
4. **Admin Dashboard**: Real-time data from MongoDB collections
5. **Super Admin Panel**: User management and system analytics

## External Dependencies

### Frontend Dependencies
- React ecosystem (React 18, React DOM)
- UI Components: Radix UI primitives with shadcn/ui
- Form handling: React Hook Form with Hookform resolvers and Zod validation
- HTTP client: TanStack Query for server state management
- Styling: Tailwind CSS with class-variance-authority
- Icons: Lucide React, React Icons
- Charts: Recharts for data visualization
- File handling: XLSX for Excel file processing

### Backend Dependencies
- Express.js for server framework
- MongoDB native driver for database operations
- JWT for authentication tokens
- bcrypt for password hashing
- Google Auth Library for OAuth integration
- Zod for schema validation and data validation
- Express sessions for session management

### Development Dependencies
- Vite for development server and build
- TypeScript for type safety
- ESLint and Prettier for code quality
- Replit-specific plugins for development environment
- esbuild for production builds

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Node.js server with tsx for TypeScript execution
- MongoDB connection for data persistence
- Replit-specific development tools and overlays
- Environment variables for configuration

### Production Build
- Frontend: Vite build to `dist/public/`
- Backend: esbuild bundle to `dist/index.js`
- Static file serving from Express
- MongoDB connection with production credentials
- Environment variables for secure configuration

### Database Architecture
- **Current**: MongoDB with native driver
- **Collections Schema**:
  - Users: ObjectId, email, name, password, role, createdAt
  - Questions: ObjectId, date, sessionTitle, questions array, createdBy, createdAt
  - Submissions: ObjectId, userId, questionSetId, date, answers, evaluation, submittedAt

### File Storage Structure
```
server/data/
├── users.json          # Legacy: User accounts (migrated to MongoDB)
├── questions.json      # Legacy: Test questions (migrated to MongoDB)
└── submissions.json    # Legacy: Test submissions (migrated to MongoDB)
```

### Security Considerations
- JWT tokens with 24-hour expiration and secure headers
- Role-based route protection on both frontend and backend
- Password hashing with bcrypt salt rounds
- Input validation with Zod schemas on all endpoints
- CORS and security headers via Express middleware
- Environment variables for sensitive configuration
- MongoDB connection security with proper authentication

### Mobile Responsiveness
- Tailwind CSS responsive design system
- Mobile-first approach with breakpoint utilities
- Touch-friendly UI components with proper sizing
- Responsive navigation with collapsible sidebar
- Optimized forms for mobile input
- Progressive Web App capabilities

### Performance Optimizations
- TanStack Query for efficient data fetching and caching
- React.memo for component optimization
- Lazy loading for large components
- MongoDB indexing for query performance
- Vite code splitting for optimal bundle sizes
- Express compression middleware

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with JWT response
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback

### Questions Management
- `GET /api/questions` - Get questions by date
- `POST /api/questions` - Upload question sets (Admin+)
- `PUT /api/questions/:id` - Update questions (Admin+)
- `DELETE /api/questions/:id` - Delete questions (Admin+)

### Submissions Management
- `GET /api/submissions` - Get submissions (role-based filtering)
- `POST /api/submissions` - Submit test answers
- `PUT /api/submissions/:id/evaluate` - Evaluate submission (Admin+)
- `GET /api/submissions/user/:userId` - Get user submissions

### User Management
- `GET /api/users` - Get all users (Admin+)
- `POST /api/users` - Create user (Super Admin)
- `PUT /api/users/:id` - Update user (Admin+)
- `DELETE /api/users/:id` - Delete user (Super Admin)
