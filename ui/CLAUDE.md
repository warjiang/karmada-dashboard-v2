# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Karmada Dashboard v2 UI - a React/TypeScript web application for managing multi-cloud Kubernetes resources. Built as a monorepo using pnpm workspaces with Turbo for build orchestration, Vite for development, and Ant Design for UI components.

## Development Commands

### Package Management
- `pnpm install` - Install dependencies (uses pnpm workspaces)
- `pnpm install --frozen-lockfile` - Install dependencies for CI/CD
- `pnpm update` - Update dependencies across workspaces

### Build Commands  
- `pnpm dashboard:build` - Build the dashboard app for production
- `pnpm dashboard:dev` - Start dashboard development server
- `pnpm preview` - Preview production build locally (from apps/dashboard)

### Testing Commands
- `cd apps/dashboard && pnpm test` - Run tests for dashboard app
- `cd apps/dashboard && pnpm test:watch` - Run tests in watch mode
- `cd apps/dashboard && pnpm test:coverage` - Run tests with coverage
- No unit/integration/e2e test scripts currently configured

### Code Quality Commands
- `cd apps/dashboard && pnpm lint` - Run ESLint for dashboard
- `cd apps/dashboard && pnpm lint --fix` - Auto-fix ESLint issues  
- `pnpm format` - Format code with Prettier (workspace-wide)
- `cd apps/dashboard && pnpm build` - TypeScript type checking (via tsc in build)

### Development Tools
- `cd apps/dashboard && pnpm i18n:scan` - Scan for i18n keys
- `cd apps/dashboard && pnpm i18n:init` - Initialize i18n
- No storybook or bundle analyzer currently configured

## Technology Stack

### Core Technologies
- **TypeScript** - Primary language with strict type checking
- **React 18** - UI library with hooks and functional components  
- **Node.js** - Runtime environment (>=18.14.0)
- **pnpm** - Fast, disk space efficient package manager

### UI Framework & Libraries
- **Ant Design 5.x** - Enterprise-class UI components
- **Tailwind CSS** - Utility-first CSS framework with custom config
- **Less** - CSS preprocessor for component styling
- **Lucide React** - Icon library
- **clsx/tailwind-merge** - Conditional CSS class utilities

### Build & Development Tools  
- **Vite** - Fast build tool and development server
- **Turbo** - Build system for monorepos
- **ESBuild** - Extremely fast JavaScript bundler (via Vite)

### State Management & Data Fetching
- **Zustand** - Lightweight state management
- **@tanstack/react-query** - Server state management and caching
- **Axios** - HTTP client for API calls

### Development Tools
- **Monaco Editor** - Code editor (VS Code engine)
- **React Router v6** - Client-side routing
- **React i18next** - Internationalization framework
- **@karmada/i18n-tool** - Custom i18n tooling

### Code Quality Tools
- **ESLint** - TypeScript/React linting with custom configs
- **Prettier** - Code formatter with lint-staged
- **TypeScript** - Strict type checking enabled
- **Husky** - Git hooks for pre-commit validation

## Project Structure Guidelines

### File Organization
```
ui/                           # Monorepo root
├── apps/dashboard/          # Main dashboard application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── auth/        # Authentication components  
│   │   │   ├── navigation/  # Navigation components
│   │   │   ├── terminal/    # Terminal/console components
│   │   │   └── icons/       # Icon components
│   │   ├── pages/           # Page components organized by feature
│   │   │   ├── cluster-manage/           # Cluster management
│   │   │   ├── multicloud-resource-manage/  # Resource management
│   │   │   │   ├── workload/            # Workload management
│   │   │   │   ├── config/              # ConfigMaps/Secrets
│   │   │   │   ├── service/             # Services/Ingress  
│   │   │   │   └── namespace/           # Namespace management
│   │   │   ├── multicloud-policy-manage/    # Policy management
│   │   │   ├── basic-config/            # Basic configuration
│   │   │   └── advanced-config/         # Advanced configuration
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layout/          # Layout components (header, sidebar)
│   │   ├── services/        # API service layer
│   │   ├── store/           # Zustand stores  
│   │   ├── utils/           # Utility functions
│   │   └── routes/          # React Router configuration
│   ├── locales/             # i18n translation files
│   └── public/              # Static assets
└── packages/                # Shared workspace packages
    ├── @karmada/terminal    # Terminal package
    ├── @karmada/utils       # Shared utilities
    └── @karmada/i18n-tool   # i18n tooling
```

### Naming Conventions
- **Files**: Use kebab-case for file names (`cluster-manage.tsx`)
- **Components**: Use PascalCase for component names (`ClusterManager`)
- **Functions**: Use camelCase for function names (`getClusterData`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (`API_BASE_URL`)
- **Types/Interfaces**: Use PascalCase with descriptive names (`ClusterData`, `ApiResponse`)
- **Hooks**: Prefix with `use` (`useNamespace`, `useTagNum`)

## TypeScript Guidelines

### Type Safety
- Enable strict mode in `tsconfig.json`
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use union types for multiple possible values
- Avoid `any` type - use `unknown` when type is truly unknown

### Best Practices
- Use type guards for runtime type checking
- Leverage utility types (`Partial`, `Pick`, `Omit`, etc.)
- Create custom types for domain-specific data
- Use enums for finite sets of values
- Document complex types with JSDoc comments

## Code Quality Standards

### ESLint Configuration
- Use recommended ESLint rules for JavaScript/TypeScript
- Enable React-specific rules if using React
- Configure import/export rules for consistent module usage
- Set up accessibility rules for inclusive development

### Prettier Configuration
- Use consistent indentation (2 spaces recommended)
- Set maximum line length (80-100 characters)
- Use single quotes for strings
- Add trailing commas for better git diffs

### Testing Standards
- Aim for 80%+ test coverage
- Write unit tests for utilities and business logic
- Use integration tests for component interactions
- Implement e2e tests for critical user flows
- Follow AAA pattern (Arrange, Act, Assert)

## Performance Optimization

### Bundle Optimization
- Use code splitting for large applications
- Implement lazy loading for routes and components
- Optimize images and assets
- Use tree shaking to eliminate dead code
- Analyze bundle size regularly

### Runtime Performance
- Implement proper memoization (React.memo, useMemo, useCallback)
- Use virtualization for large lists
- Optimize re-renders in React applications
- Implement proper error boundaries
- Use web workers for heavy computations

## Security Guidelines

### Dependencies
- Regularly audit dependencies with `npm audit`
- Keep dependencies updated
- Use lock files (`package-lock.json`, `yarn.lock`)
- Avoid dependencies with known vulnerabilities

### Code Security
- Sanitize user inputs
- Use HTTPS for API calls
- Implement proper authentication and authorization
- Store sensitive data securely (environment variables)
- Use Content Security Policy (CSP) headers

## Karmada Dashboard Specific Guidelines

### API Integration
- APIs proxied through Vite dev server to localhost:8000
- Main API: `/api/v1/*` endpoints
- Cluster API: `/clusterapi/*` endpoints  
- Terminal: WebSocket at `/api/v1/terminal/sockjs*`

### Development Patterns
- Use React Query for server state management
- Zustand for client-side state (global.ts)
- Ant Design components with Tailwind for styling
- Monaco Editor for YAML/JSON editing
- i18next for internationalization

### Component Architecture
- Feature-based organization in pages/
- Shared components in components/
- Modal/Drawer patterns for forms
- Table components with Ant Design

## Development Workflow

### Before Starting
1. Check Node.js version (>=18.14.0)
2. Install dependencies: `pnpm install`
3. No .env.example - check vite.config.ts for proxy settings
4. Start development: `pnpm dashboard:dev`

### During Development
1. Use TypeScript with strict mode enabled
2. Follow Ant Design patterns for UI consistency
3. Use React Query for data fetching
4. Test in browser with hot module replacement
5. Use meaningful commit messages

### Before Committing  
1. Check linting: `cd apps/dashboard && pnpm lint`
2. Verify build: `pnpm dashboard:build`
3. Format code: `pnpm format` (workspace-wide)
4. Review browser console for errors
5. Test key user flows manually