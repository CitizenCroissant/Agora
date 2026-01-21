# Testing and Linting Guide

This document provides comprehensive guidance on testing and linting in the Agora project.

## Table of Contents

- [Overview](#overview)
- [Linting](#linting)
- [Testing](#testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Overview

The Agora project uses:
- **ESLint** for code linting and style enforcement
- **TypeScript** for type checking
- **Vitest** for testing Node.js/TypeScript packages and apps
- **Jest** for testing the React Native mobile app

## Linting

### Configuration

The project has a hierarchical ESLint configuration:

- **Root**: `.eslintrc.js` - Base configuration for all packages
- **Web App**: `apps/web/.eslintrc.js` - Extends root + Next.js rules
- **Mobile App**: `apps/mobile/.eslintrc.js` - Extends root + React Native rules

### Running Linting

```bash
# Lint all packages
npm run lint

# Lint a specific package
cd apps/web
npm run lint

# Auto-fix linting issues
cd apps/web
npx eslint . --ext .ts,.tsx --fix
```

### Linting Rules

The configuration includes:
- TypeScript recommended rules
- Unused variable detection (with `_` prefix exemption)
- Explicit `any` type warnings
- Framework-specific rules (Next.js, React Native)

## Testing

### Test Frameworks

#### Vitest (for Node.js/TypeScript)

Used in:
- `packages/shared` - Shared utilities and types
- `apps/api` - API endpoints
- `apps/ingestion` - Data ingestion
- `apps/web` - Web application

**Configuration**: `vitest.config.ts` at the root

#### Jest (for React Native)

Used in:
- `apps/mobile` - Mobile application

**Configuration**: `apps/mobile/jest.config.js`

### Running Tests

```bash
# Run all tests (all packages)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for a specific package
cd packages/shared
npm run test

# Run tests in watch mode for a package
cd packages/shared
npm run test:watch
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory for each package.

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
# Open coverage/index.html in your browser
```

Coverage includes:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Writing Tests

### Test File Structure

Place test files in `__tests__` directories:

```
src/
  utils.ts
  __tests__/
    utils.test.ts
```

Or co-locate with source files:

```
src/
  utils.ts
  utils.test.ts
```

### Vitest Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myFunction } from '../utils';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBeNull();
  });
});
```

### Jest Test Example (React Native)

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle user interaction', () => {
    const { getByTestId } = render(<MyComponent />);
    const button = getByTestId('my-button');
    fireEvent.press(button);
    // Assert expected behavior
  });
});
```

### Mocking

#### Mocking in Vitest

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();

// Mock a module
vi.mock('../api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// Mock global fetch
global.fetch = vi.fn();
```

#### Mocking in Jest

```typescript
// Mock a module
jest.mock('../api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// Mock a function
const mockFn = jest.fn();
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) includes:

1. **Lint Job**: Runs ESLint on all packages
2. **Test Job**: Runs all tests with coverage
3. **Build Job**: Builds all packages (runs after lint and test)

Coverage reports are uploaded to Codecov (if configured).

## Best Practices

### General

1. **Write Tests First**: Consider TDD (Test-Driven Development)
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Keep Tests Simple**: One assertion per test when possible
4. **Use Descriptive Names**: Test names should describe the scenario and expected outcome
5. **Avoid Test Interdependence**: Each test should be independent

### Testing Guidelines

1. **Unit Tests**: Test individual functions/methods in isolation
2. **Integration Tests**: Test interactions between components
3. **Mock External Dependencies**: Use mocks for API calls, databases, etc.
4. **Test Edge Cases**: Include tests for empty inputs, null values, errors
5. **Maintain High Coverage**: Aim for >80% code coverage

### Linting Guidelines

1. **Fix Linting Errors Before Committing**: Don't ignore linting errors
2. **Use ESLint Auto-fix**: Let ESLint fix simple issues automatically
3. **Consistent Formatting**: Use consistent code style across the project
4. **Type Safety**: Leverage TypeScript's type system
5. **Avoid `any`**: Use specific types instead of `any` when possible

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Tests timing out

```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Coverage not working

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8
```

### Getting Help

- Check existing tests in `__tests__` directories for examples
- Review Vitest documentation: https://vitest.dev
- Review Jest documentation: https://jestjs.io
- Review ESLint documentation: https://eslint.org

## Summary

- **Lint**: `npm run lint`
- **Test**: `npm run test`
- **Test with coverage**: `npm run test:coverage`
- **Test in watch mode**: `npm run test:watch`

All commands can be run from the root (for all packages) or from individual package directories.
