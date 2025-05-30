"typecheck": "react-router typegen && tsc",
"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
"lint:fix": "eslint . --ext ts,tsx --fix",
```

# Frontend

This is the frontend application for the chat app, built with React Router v7, TypeScript, and Tailwind CSS.

## Features

- **Authentication System**: Complete login/register flow with JWT tokens
- **Real-time Chat**: Socket.io integration for live messaging
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Modern Routing**: React Router v7 with file-based routing

## Tech Stack

- **Framework**: React 19 with React Router v7
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.io Client
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Testing

The application includes a comprehensive test suite with **71 test cases** covering:

### Test Coverage

#### **Utility Functions (16 tests)**
- `app/utils/__tests__/auth.test.ts`: Authentication utilities
  - Token management (localStorage operations)
  - API calls (login, register, logout)
  - Token validation and JWT handling
  - Error handling for network failures

#### **Custom Hooks (10 tests)**
- `app/hooks/__tests__/useAuth.test.tsx`: Authentication hook
  - Context provider functionality
  - Authentication state management
  - Login/logout operations
  - Token validation on initialization
  - Loading states and error handling

#### **Components (26 tests)**
- `app/components/__tests__/LoginForm.test.tsx` (12 tests):
  - Form rendering and structure
  - User interactions and input validation
  - Form submission with loading states
  - Error handling and display
  - Accessibility features

- `app/components/__tests__/Navbar.test.tsx` (14 tests):
  - Conditional rendering based on auth state
  - User avatar and display logic
  - Logout functionality
  - CSS styling and responsive design
  - Keyboard accessibility

#### **Routes (7 tests)**
- `app/routes/__tests__/home.test.tsx`: Home page routing
  - Loading state display
  - Authentication-based redirects
  - Component structure and styling
  - Navigation behavior

#### **Server Integration (12 tests)**
- `app/utils/__tests__/server-ping.test.ts`: Server connectivity
  - Ping functionality and latency calculation
  - Health check endpoints
  - Connection monitoring and status tracking
  - Retry logic and error handling
  - Environment configuration

### Test Features

- **Mocking**: Comprehensive mocking of external dependencies
- **User Interactions**: Real user event simulation with `@testing-library/user-event`
- **Accessibility Testing**: ARIA compliance and keyboard navigation
- **Error Scenarios**: Network failures and edge cases
- **Loading States**: Async operation testing
- **Component Integration**: Full component lifecycle testing

### Running Specific Tests

```bash
# Run specific test file
npm test auth.test.ts

# Run tests matching pattern
npm test -- --grep "LoginForm"

# Run tests in specific directory
npm test components/
```

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── __tests__/      # Component tests
│   ├── LoginForm.tsx
│   ├── Navbar.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── __tests__/      # Hook tests
│   ├── useAuth.tsx
│   └── ...
├── routes/             # Page components
│   ├── __tests__/      # Route tests
│   ├── home.tsx
│   └── ...
├── utils/              # Utility functions
│   ├── __tests__/      # Utility tests
│   ├── auth.ts
│   └── ...
└── root.tsx           # App root component
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:9999
VITE_NODE_ENV=development
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use TypeScript for type safety
5. Follow accessibility best practices

# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
