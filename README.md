# Express.js TypeScript Backend

![CI](https://github.com/username/repo/workflows/CI/badge.svg)

A modern Express.js backend built with TypeScript, featuring comprehensive linting, formatting, and testing setup.

## 🚀 Features

- **Express.js** with TypeScript support
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for unit testing with coverage
- **GitHub Actions** for CI/CD
- **Hot reload** development server

## 📁 Project Structure

```
be/
├── src/                 # Source code
│   └── index.ts        # Main Express server
├── tests/              # Unit tests
│   └── index.test.ts   # API endpoint tests
├── dist/               # Compiled JavaScript (build output)
├── coverage/           # Test coverage reports
├── .github/workflows/  # GitHub Actions workflows
└── jest.config.js      # Jest configuration
```

## 🛠️ Development

### Prerequisites

- Node.js 18.x or 20.x
- npm

### Installation

```bash
npm install
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm start           # Run production build

# Building
npm run build       # Compile TypeScript to JavaScript
npm run clean       # Clean build directory

# Testing
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format      # Format code with Prettier
npm run format:check # Check if code is properly formatted
```

## 🔧 GitHub Actions CI

The CI pipeline runs on every push and pull request to `main` and `develop` branches.

### CI Checks

1. **Linting** - ESLint checks for code quality
2. **Formatting** - Prettier ensures consistent code style
3. **Type Checking** - TypeScript compilation
4. **Unit Tests** - Jest test suite with coverage
5. **Multi-Node Testing** - Tests on Node.js 18.x and 20.x

### CI Workflow

```yaml
- Install dependencies
- Run ESLint
- Check Prettier formatting
- Build TypeScript
- Run unit tests
- Generate coverage report
- Upload coverage to Codecov (optional)
```

## 📊 Test Coverage

Current test coverage: **100%**

- All API endpoints tested
- Error handling verified
- Response format validation

## 🌐 API Endpoints

- `GET /` - Welcome message with timestamp
- `GET /health` - Health check with uptime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run lint && npm test`
5. Submit a pull request

The CI pipeline will automatically run all checks on your pull request.
