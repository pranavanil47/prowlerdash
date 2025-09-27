# Prowler Dashboard

## Overview

This is a full-stack web application that provides a security asset inventory management and monitoring system for cloud infrastructure. The application integrates with Prowler (a security assessment tool) to display and manage security assets, compliance status, and vulnerability data in an intuitive dashboard interface.

The system allows users to configure their Prowler instance, view comprehensive asset inventories, filter and search through security findings, and monitor compliance status across their cloud resources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling and logging middleware
- **Authentication**: OpenID Connect (OIDC) integration with Replit Auth using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **Password Security**: bcrypt for password hashing

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection Pooling**: Neon serverless connection pooling for scalability

### Authentication and Authorization
- **Provider**: Replit OIDC for user authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, secure flags, and CSRF protection
- **User Management**: User profile storage with email, names, and profile images

### External Service Integrations
- **Prowler API**: HTTP client integration for fetching security assessment data
- **Authentication Flow**: Token-based authentication with Prowler instances
- **Data Synchronization**: Configurable sync intervals for asset data updates
- **Error Handling**: Comprehensive error handling for external API failures

### Key Architectural Decisions

1. **Monorepo Structure**: Organized into client, server, and shared directories for clear separation of concerns while enabling code sharing
2. **Type Safety**: End-to-end TypeScript with shared schema definitions between frontend and backend
3. **Component Architecture**: Atomic design principles with reusable UI components and consistent styling
4. **API Integration**: Service layer pattern for external integrations with proper error handling and retry logic
5. **Security-First Design**: Secure session management, input validation, and proper authentication flows

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Replit OIDC service
- **Session Storage**: PostgreSQL with connect-pg-simple

### Third-Party APIs
- **Prowler API**: Security assessment data provider requiring URL, email, and password authentication

### Development Tools
- **Build System**: Vite for frontend bundling and development server
- **Type Checking**: TypeScript compiler with strict mode
- **Code Quality**: ESLint configuration (referenced but not visible in current files)
- **UI Development**: Replit-specific development plugins for enhanced development experience

### Runtime Dependencies
- **Frontend**: React ecosystem with Radix UI, TanStack Query, and utility libraries
- **Backend**: Express.js with authentication, session management, and database connectivity
- **Shared**: Drizzle ORM, Zod validation, and common type definitions