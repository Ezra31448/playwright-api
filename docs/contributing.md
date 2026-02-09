# Contributing Guide

Thank you for your interest in contributing to the Playwright API testing framework! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation Standards](#documentation-standards)
7. [Pull Request Process](#pull-request-process)
8. [Release Process](#release-process)

## Code of Conduct

This project follows a standard code of conduct. Please be respectful and inclusive in all interactions with the community.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (usually comes with Node.js)
- Git
- A code editor (VS Code recommended)

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/playwright-api.git
   cd playwright-api
   ```
3. Add the original repository as a remote:
   ```bash
   git remote add upstream https://github.com/Ezra31448/playwright-api.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Development Environment

For the best development experience, we recommend using VS Code with the following extensions:

- Playwright Test for VSCode
- TypeScript and JavaScript Language Features
- ESLint (if configured)

## Development Workflow

### 1. Create a Branch

Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix-name
```

### 2. Make Changes

Make your changes to the codebase. Follow the coding standards outlined below.

### 3. Test Your Changes

Run the test suite to ensure your changes don't break existing functionality:

```bash
npx playwright test
```

If you're adding new functionality, write tests to cover it.

### 4. Commit Your Changes

Commit your changes with a clear, descriptive commit message:

```bash
git add .
git commit -m "feat: add new feature for handling API responses"
```

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

### 5. Push to Your Fork

Push your changes to your fork:

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

Create a pull request against the main branch of the original repository. Provide a clear description of your changes and why they're needed.

## Coding Standards

### TypeScript

This project uses TypeScript. Follow these guidelines:

- Use TypeScript for all new code
- Provide type annotations for function parameters and return values
- Use interfaces for complex object structures
- Avoid using `any` type when possible

```typescript
// Good
interface ApiResponse {
  data: Article[];
  count: number;
}

async function getArticles(limit: number): Promise<ApiResponse> {
  // implementation
}

// Avoid
async function getArticles(limit: any): Promise<any> {
  // implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Include semicolons at the end of statements
- Use camelCase for variable and function names
- Use PascalCase for classes and interfaces

```typescript
// Good
const requestHandler = new RequestHandler(request, baseUrl, logger);

class ApiResponseHandler {
  // implementation
}

// Avoid
const Request_Handler = new RequestHandler(request, base_url);
```

### Error Handling

- Use try-catch blocks for error-prone operations
- Provide meaningful error messages
- Use custom error types when appropriate

```typescript
// Good
try {
  const response = await api.getRequest(200);
  return response;
} catch (error) {
  throw new ApiRequestError(`Failed to fetch data: ${error.message}`);
}

// Avoid
try {
  const response = await api.getRequest(200);
  return response;
} catch (error) {
  throw error;
}
```

### Comments and Documentation

- Add JSDoc comments for public methods and classes
- Use comments to explain complex logic
- Keep comments up-to-date with code changes

```typescript
/**
 * Makes a GET request to the specified endpoint
 * @param path - The API endpoint path
 * @param params - Query parameters to include in the request
 * @param expectedStatusCode - Expected HTTP status code for validation
 * @returns Promise resolving to the JSON response
 */
async getRequest(
  path: string,
  params?: Record<string, string>,
  expectedStatusCode: number = 200,
): Promise<any> {
  // implementation
}
```

### Project-Specific Guidelines

#### RequestHandler Extensions

When extending the [`RequestHandler`](../utils/request-handler.ts:5) class:

1. Always include logging via the APILogger
2. Follow the existing pattern for status code validation
3. Return JSON response bodies (or null for 204 No Content)
4. Maintain method chaining for builder methods

```typescript
async patchRequest(expectedStatusCode: number) {
  const url = this.getUrl();
  this.logger.logRequest("PATCH", url, this.apiHeaders, this.apiBody);
  const response = await this.request.patch(url, {
    headers: this.apiHeaders,
    data: this.apiBody,
  });

  const actualStatus = response.status();
  const responseJson = await response.json();

  this.logger.logResponse(actualStatus, responseJson);
  this.statusCodeValidator(actualStatus, expectedStatusCode, this.patchRequest);

  return responseJson;
}
```

#### Logger Implementation

When working with the [`APILogger`](../utils/logger.ts:1):

1. Log requests before execution
2. Log responses after execution
3. Include all relevant information (method, URL, headers, body, status)
4. Use consistent formatting for log entries

## Testing Guidelines

### Test Structure

- Organize tests by functionality in separate files
- Use descriptive test names that explain what is being tested
- Group related tests using `test.describe()`
- Use `test.beforeEach()` and `test.afterEach()` for setup and teardown

```typescript
test.describe("RequestHandler", () => {
  test.beforeEach(async ({ request }) => {
    // setup code
  });

  test("should make GET request successfully", async ({ api }) => {
    // test implementation
  });

  test("should handle 404 error", async ({ api }) => {
    // test implementation
  });
});
```

### Test Coverage

- Write tests for all new functionality
- Aim for high test coverage
- Test both success and error scenarios
- Use parameterized tests for similar test cases

```typescript
// Good: Testing multiple scenarios
const testCases = [
  { limit: 5, expected: 5 },
  { limit: 10, expected: 10 },
  { limit: 20, expected: 20 },
];

testCases.forEach(({ limit, expected }) => {
  test(`should return ${expected} articles when limit is ${limit}`, async ({
    api,
  }) => {
    const response = await api
      .path("/articles")
      .params({ limit })
      .getRequest(200);
    expect(response.articles.length).toBeLessThanOrEqual(expected);
  });
});
```

### Test Data

- Use test data factories for creating test objects
- Avoid hardcoding test data in tests
- Clean up created data after tests

```typescript
// utils/test-data-factory.ts
export function createArticleData(overrides = {}) {
  return {
    title: "Test Article",
    description: "Test Description",
    body: "Test Body",
    tagList: ["test"],
    ...overrides,
  };
}

// In test
test("should create article", async ({ api }) => {
  const articleData = createArticleData({ title: "Custom Title" });
  // test implementation
});
```

### Test Isolation

- Each test should be independent
- Clean up resources after tests
- Don't rely on test execution order

```typescript
test("should create and delete article", async ({ api }) => {
  // Create
  const createResponse = await api
    .path("/articles")
    .body({ article: createArticleData() })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slug = createResponse.article.slug;

  // Cleanup
  await api
    .path(`/articles/${slug}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

## Documentation Standards

### README.md

- Keep the README up-to-date with the latest changes
- Include clear installation and usage instructions
- Provide examples of common use cases
- Document all features and capabilities

### API Documentation

- Document all public APIs with JSDoc comments
- Include parameter types and return types
- Provide usage examples for complex methods

### Code Comments

- Add comments for complex business logic
- Explain the "why" not just the "what"
- Keep comments concise and relevant

### Documentation Files

When updating documentation in the `docs/` directory:

1. Keep examples up-to-date with actual code
2. Use consistent formatting and structure
3. Include code examples that are copy-paste ready
4. Cross-reference related documentation

## Pull Request Process

### Before Submitting

1. Ensure your code follows the coding standards
2. Run all tests and ensure they pass
3. Update documentation if necessary
4. Rebase your branch against the main branch

```bash
git fetch upstream
git rebase upstream/main
```

### Pull Request Template

When creating a pull request, include:

1. **Description**: A clear description of what you've changed and why
2. **Testing**: How you've tested your changes
3. **Documentation**: Any documentation updates
4. **Breaking Changes**: Note any breaking changes

Example:

```
## Description
Added PATCH method support to RequestHandler class for partial updates.

## Testing
- Added unit tests for patchRequest method
- Tested with real API endpoints
- All existing tests pass

## Documentation
- Updated api-reference.md with patchRequest documentation
- Added examples to examples.md

## Breaking Changes
None
```

### Review Process

1. All pull requests require review before merging
2. Address feedback from reviewers promptly
3. Keep the pull request updated with the latest changes
4. Ensure the PR is mergeable before requesting final review

### Merging

- Maintain a clean commit history
- Use squash merging for feature branches
- Delete the feature branch after merging

## Release Process

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in package.json
2. Update CHANGELOG.md with release notes
3. Tag the release in Git
4. Create a GitHub release

## Types of Contributions

### Bug Fixes

- Fixing issues in existing functionality
- Ensure tests are added or updated
- Document the bug and the fix

### New Features

- Implement new functionality
- Add comprehensive tests
- Update documentation
- Consider backward compatibility

### Documentation

- Improving existing documentation
- Adding examples and tutorials
- Fixing typos and grammatical errors
- Translating documentation

### Performance Improvements

- Optimizing code for better performance
- Adding performance tests
- Documenting performance improvements

### Refactoring

- Improving code structure without changing functionality
- Adding or improving type definitions
- Enhancing code readability

## Getting Help

If you need help with contributing:

1. Check existing issues and pull requests
2. Read the documentation thoroughly
3. Ask questions in issues
4. Join community discussions

## Project Structure Overview

When contributing, it's helpful to understand the project structure:

```
playwright-api/
├── docs/           # Documentation files
├── tests/          # Test files
├── utils/          # Utility classes
│   ├── fixtures.ts          # Test fixtures
│   ├── logger.ts            # APILogger class
│   └── request-handler.ts  # RequestHandler class
├── playwright.config.ts     # Playwright configuration
└── package.json            # Project dependencies
```

### Key Components

- **RequestHandler**: Fluent API for making HTTP requests with built-in logging
- **APILogger**: Logging utility for requests and responses
- **Fixtures**: Playwright test fixtures that provide pre-configured utilities

When adding new features or modifying existing ones, consider how they integrate with these core components.

Thank you for contributing to the Playwright API testing framework! Your contributions help make this project better for everyone.
