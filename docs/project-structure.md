# Project Structure

This document explains the structure and purpose of each component in the Playwright API testing framework.

## Directory Structure

```
playwright-api/
├── docs/                    # Documentation files
│   ├── api-reference.md     # RequestHandler class API documentation
│   ├── testing-patterns.md  # Best practices and testing patterns
│   ├── project-structure.md # This file - explanation of project structure
│   ├── setup-configuration.md # Environment setup guide
│   ├── examples.md          # Common API testing scenarios
│   └── contributing.md      # Contribution guidelines
├── tests/                   # Test files
│   ├── example.spec.ts      # Example test cases demonstrating various patterns
│   └── smokeTest.spec.ts    # Smoke tests using the custom RequestHandler
├── utils/                   # Utility classes and fixtures
│   ├── fixtures.ts          # Playwright test fixtures
│   └── request-handler.ts   # Custom RequestHandler class
├── playwright.config.ts     # Playwright configuration
├── package.json             # Project dependencies and scripts
├── package-lock.json        # Lock file for exact dependency versions
├── .gitignore               # Git ignore file
└── README.md                # Project overview and quick start guide
```

## Component Details

### `/tests` Directory

Contains all test files for the API testing framework.

#### `example.spec.ts`

Demonstrates comprehensive API testing patterns including:

- Authentication setup with `beforeAll`
- Creating, reading, updating, and deleting (CRUD) operations
- Direct Playwright API usage without the RequestHandler utility
- Complex test scenarios with multiple API calls

Key features:

- Authentication token management
- Article creation, modification, and deletion
- Response validation with assertions
- Test cleanup patterns

#### `smokeTest.spec.ts`

Contains simplified smoke tests using the custom RequestHandler utility:

- Demonstrates the fluent interface of RequestHandler
- Shows basic GET requests with query parameters
- Provides examples of the testing fixture usage

### `/utils` Directory

Contains utility classes and test fixtures that support the testing framework.

#### `request-handler.ts`

The core utility class that provides a fluent interface for API requests.

Key features:

- Method chaining for building requests
- Automatic URL construction with query parameters
- Response status code validation
- Integration with Playwright's APIRequestContext

Methods:

- `url()`: Set custom base URL
- `path()`: Set API endpoint path
- `params()`: Add query parameters
- `header()`: Set request headers
- `body()`: Set request body (for POST/PUT)
- `getRequest()`: Execute GET request with status validation

#### `fixtures.ts`

Defines Playwright test fixtures that provide pre-configured utilities to tests.

Key features:

- Custom `api` fixture that provides a pre-configured RequestHandler instance
- TypeScript type definitions for test options
- Integration with Playwright's test runner

The fixture:

- Automatically creates a RequestHandler with the base URL
- Makes the `api` fixture available in all tests
- Handles cleanup and lifecycle management

### `playwright.config.ts`

Configuration file for Playwright test runner.

Key configurations:

- Test directory: `./tests`
- Parallel test execution
- Retry configuration for CI environments
- HTML and list reporters
- Custom project configuration for API testing (no browser devices)

Notable settings:

- `testDir`: Points to the tests directory
- `fullyParallel`: Enables parallel test execution
- `reporter`: Configures HTML and list reporters
- `projects`: Defines an "api-testing" project without browser-specific settings

### `package.json`

Node.js package configuration file.

Key sections:

- Dependencies: Playwright testing framework and Node.js types
- Repository information: Git repository URL and links
- Scripts: Currently empty but can be extended with custom test scripts

Dependencies:

- `@playwright/test`: The Playwright testing framework
- `@types/node`: TypeScript definitions for Node.js

## Data Flow

### Test Execution Flow

1. Playwright test runner loads `playwright.config.ts`
2. Test fixtures from `utils/fixtures.ts` are initialized
3. The `api` fixture creates a RequestHandler instance with the base URL
4. Tests use the `api` fixture to make API calls
5. RequestHandler builds the request and executes it via Playwright's APIRequestContext
6. Responses are validated and returned to the test
7. Test assertions verify expected behavior
8. Fixtures are cleaned up after test completion

### RequestHandler Flow

1. Test calls methods on the `api` fixture (RequestHandler instance)
2. Each method call modifies the internal state of the RequestHandler
3. When `getRequest()` is called:
   - URL is constructed from base URL, path, and query parameters
   - Request is made with configured headers
   - Response status code is validated against expected value
   - JSON response body is parsed and returned

## Extension Points

The framework is designed to be extensible in several ways:

### Adding New HTTP Methods

The RequestHandler can be extended with additional HTTP methods:

```typescript
async postRequest(expectedStatusCode: number) {
  const url = this.getUrl();
  const response = await this.request.post(url, {
    headers: this.apiHeaders,
    data: this.apiBody,
  });
  expect(response.status()).toEqual(expectedStatusCode);
  return await response.json();
}
```

### Adding New Fixtures

Additional fixtures can be added to `fixtures.ts`:

```typescript
export type TestOptions = {
  api: RequestHandler;
  authenticatedApi: RequestHandler; // New fixture with auth
};

export const test = base.extend<TestOptions>({
  // Existing api fixture...

  authenticatedApi: async ({ request }, use) => {
    const baseUrl: string = "https://api.example.com";
    const requestHandler = new RequestHandler(request, baseUrl);

    // Add authentication
    const token = await authenticateUser(request);
    requestHandler.header({ Authorization: token });

    await use(requestHandler);
  },
});
```

### Adding Custom Utilities

Additional utility classes can be added to the `utils/` directory:

```typescript
// utils/data-generator.ts
export class DataGenerator {
  static randomEmail(): string {
    return `test-${Math.random()}@example.com`;
  }

  static randomArticleData() {
    return {
      title: `Test Article ${Math.random()}`,
      description: "Generated test article",
      body: "This is auto-generated test content",
      tagList: ["test", "auto-generated"],
    };
  }
}
```

## Best Practices for Structure

1. **Keep tests focused**: Each test file should focus on a specific API endpoint or feature
2. **Use descriptive names**: File names should clearly indicate what they test
3. **Separate concerns**: Keep utilities, fixtures, and tests in separate directories
4. **Document extensions**: When adding new utilities or fixtures, document them appropriately
5. **Maintain consistency**: Follow existing patterns when adding new code

## Future Enhancements

Potential improvements to the project structure:

1. **Test data directory**: Add a `fixtures/` directory for test data files
2. **Environment configs**: Add environment-specific configuration files
3. **Custom reporters**: Implement custom test reporters for specific needs
4. **Test utilities**: Expand the `utils/` directory with more helper classes
5. **Type definitions**: Add more comprehensive TypeScript type definitions
6. **Test scripts**: Add npm scripts for common test operations
