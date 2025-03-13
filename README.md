# GifticApp Monorepo

This is a monorepo for the GifticApp project, containing all the code for the frontend, backend, and blockchain components.

## Project Structure

```
gifticapp/
├── packages/
│   ├── frontend/     # React Native Expo app
│   ├── backend/      # Express.js API server
│   ├── blockchain/   # Hardhat Ethereum contracts
│   ├── shared/       # Shared utilities, types, and constants
│   └── config/       # Shared configuration (ESLint, TypeScript, etc.)
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gifticapp.git
   cd gifticapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build all packages:
   ```
   npm run build
   ```

## Development

To start development servers for all packages:

```
npm run dev
```

To run only specific packages:

```
cd packages/frontend
npm run dev

# or

cd packages/backend
npm run dev

# or

cd packages/blockchain
npm run dev
```

## Testing

To run tests for all packages:

```
npm run test
```

## Linting

To lint all packages:

```
npm run lint
```

## Cleaning

To clean all packages:

```
npm run clean
```

## License

[MIT](LICENSE)
