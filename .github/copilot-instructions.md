<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# FlowTune Project Copilot Instructions

This is a full-stack TypeScript project with the following architecture:

## Project Structure
- **Backend**: Hono framework with Drizzle ORM and SQLite database
- **Frontend**: React with Vite, integrating Flowgram.ai for flow-based automation
- **Desktop**: Electron application wrapping the frontend
- **Shared**: Common types and utilities

## Code Style Guidelines
- Use TypeScript strict mode
- Follow functional programming patterns where appropriate
- Use proper error handling with try/catch blocks
- Implement proper TypeScript types for all functions and variables
- Use async/await instead of .then() for promises

## Database Guidelines
- Use Drizzle ORM for all database operations
- Define schemas in `packages/backend/src/db/schema.ts`
- Use proper foreign key relationships
- Implement proper migration scripts

## API Guidelines
- Use Hono framework patterns
- Implement proper CORS configuration
- Use proper HTTP status codes
- Validate request bodies using Zod schemas
- Follow RESTful API conventions

## Frontend Guidelines
- Use React functional components with hooks
- Implement proper state management
- Use TypeScript interfaces from shared package
- Follow responsive design principles
- Integrate Flowgram.ai components for workflow visualization

## Electron Guidelines
- Use secure defaults (no node integration, context isolation enabled)
- Implement proper IPC communication when needed
- Handle window management properly
- Use proper menu structure for desktop app

## Development Workflow
- Use the monorepo workspace structure
- Run development servers concurrently
- Use proper TypeScript project references
- Implement proper error boundaries and logging
