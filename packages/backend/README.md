# Gifticapp Backend

## TypeScript Migration

This project is in the process of being migrated from JavaScript to TypeScript. The migration is being done in phases to ensure a smooth transition.

## Directory Structure

- `src/` - TypeScript source files
  - `models/` - Database models (Mongoose)
  - `routes/` - API routes (Express)
  - `services/` - Business logic and external integrations
  - `utils/` - Utility functions
  - `middleware/` - Express middleware
  - `types/` - TypeScript type definitions
- `app.js` - Original JavaScript entry point (to be phased out)
- `src/app.ts` - TypeScript entry point

## Running the Application

### TypeScript Version

```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build

# Run the compiled version
npm start

# Or run in development mode with hot-reloading
npm run dev
```

### Legacy JavaScript Version

```bash
# Run the original JavaScript version
npm run dev:js

# Or run in production mode
npm run start:js
```

## Migration Status

The following files have been migrated to TypeScript:

- ✅ `app.ts` - Main application entry point
- ✅ `logger.ts` - Logging utility
- ✅ `models/user.ts` - User model
- ✅ `models/gift.ts` - Gift model
- ✅ `routes/user.ts` - User routes
- ✅ `routes/gift.ts` - Gift routes
- ✅ `services/databaseService.ts` - MongoDB connection service
- ✅ `types/index.ts` - Shared type definitions

Files still to be migrated:

- ⬜️ `utils/walletGenerator.js`
- ⬜️ `services/blockchainService.js`
- ⬜️ `services/eventService.js`
- ⬜️ `services/giftService.js`
- ⬜️ `services/transactionMonitorService.js`
- ⬜️ `models/wallet.js`

## Migration Process

If you want to help with the migration, follow these steps:

1. Identify a JavaScript file that hasn't been migrated yet
2. Create a new TypeScript file with the same name in the `src` directory
3. Convert the JavaScript code to TypeScript, adding types
4. Update imports to point to the new location
5. Update this README to mark the file as migrated

See `TYPESCRIPT-MIGRATION.md` for more detailed instructions on how to migrate files.

## Testing

After migrating a file, please test it to ensure it works as expected:

```bash
# Build the TypeScript files
npm run build

# Run the application with the new TypeScript files
npm start
```

## Contributing

1. Follow the TypeScript conventions established in the project
2. Use interfaces for complex types
3. Avoid `any` type as much as possible
4. Add JSDoc comments for functions and classes
5. Use optional parameters with `?` rather than union types with `undefined` 