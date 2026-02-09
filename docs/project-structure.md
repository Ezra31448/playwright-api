# Project Structure

This document explains the structure and purpose of each component in the Playwright API testing framework.

## Directory Structure

```
playwright-api/
├── docs/                    # Documentation files
│   ├── api-reference.md     # RequestHandler and APILogger class API documentation
│   ├── testing-patterns.md  # Best practices and testing patterns
│   ├── project-structure.md # This file - explanation of project structure
│   ├── setup-configuration.md # Environment setup guide
│   ├── examples.md          # Common API testing scenarios
│   └── contributing.md      # Contribution guidelines
├── tests/                   # Test files
│   ├── example.spec.ts      # Example test cases demonstrating direct Playwright API usage
│   └── smokeTest.spec.ts    # Smoke tests using the custom RequestHandler
├── utils/                   # Utility classes and fixtures
│   ├── fixtures.ts          # Playwright test fixtures
│   ├── logger.ts            # APILogger class for request/response logging
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

Demonstrates comprehensive API testing patterns using Playwright's direct API:

- Authentication setup with `beforeAll`
- Creating, reading, updating, and deleting (CRUD) operations
- Direct Playwright `request` API usage without the RequestHandler utility
- Complex test scenarios with multiple API calls
- Uses the Conduit API (https://conduit-api.bondaracademy.com/api)

Key features:

- Authentication token management using `/users/login` endpoint
- Article creation, modification, and deletion
- Response validation with assertions
- Test cleanup patterns (deleting created articles)

Example test:

```typescript
test("Create, Update and Delete Article", async ({ request }) => {
  // Create article
  const newArticleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "Test",
          description: "test",
          body: "*Test*",
          tagList: ["Kanoon"],
        },
      },
      headers: { Authorization: authToken },
    },
  );

  // Update article
  const updateArticleResponse = await request.put(
    `https://conduit-api.bondaracademy.com/api/articles/${slugId}`,
    {
      headers: { Authorization: authToken },
      data: { article: { title: "Test Modified", description: "edit data" } },
    },
  );

  // Delete article
  await request.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${slugId}`,
    {
      headers: { Authorization: authToken },
    },
  );
});
```

#### `smokeTest.spec.ts`

Contains simplified smoke tests using the custom RequestHandler utility:

- Demonstrates the fluent interface of RequestHandler
- Shows basic GET, POST, PUT, and DELETE requests
- Provides examples of the testing fixture usage
- Uses the Conduit API through the RequestHandler wrapper

Key features:

- Fluent method chaining for building requests
- Automatic status code validation
- Built-in request/response logging
- Clean, readable test code

Example test:

```typescript
test("Create, Update, Get, and Delete Article", async ({ api }) => {
  // Create
  const createArticleResponse = await api
    .path("/articles")
    .header({ Authorization: authToken })
    .body({
      article: {
        title: "Test",
        description: "test",
        body: "*Test*",
        tagList: ["Kanoon"],
      },
    })
    .postRequest(201);

  // Update
  const updateArticleResponse = await api
    .path(`/articles/${slugId}`)
    .header({ Authorization: authToken })
    .body({ article: { title: "Test Modified", description: "edit data" } })
    .putRequest(200);

  // Delete
  await api
    .path(`/articles/${newSlugId}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

### `/utils` Directory

Contains utility classes and test fixtures that support the testing framework.

#### `request-handler.ts`

The core utility class that provides a fluent interface for API requests.

Key features:

- Method chaining for building requests
- Automatic URL construction with query parameters
- Response status code validation with detailed error messages
- Integration with Playwright's APIRequestContext
- Built-in logging via APILogger
- Support for GET, POST, PUT, and DELETE methods

Methods:

- `url()`: Set custom base URL
- `path()`: Set API endpoint path
- `params()`: Add query parameters
- `header()`: Set request headers
- `body()`: Set request body (for POST/PUT/DELETE)
- `getRequest()`: Execute GET request with status validation
- `postRequest()`: Execute POST request with status validation
- `putRequest()`: Execute PUT request with status validation
- `deleteRequest()`: Execute DELETE request with status validation

Private methods:

- `getUrl()`: Constructs complete URL from base URL, path, and query parameters
- `statusCodeValidator()`: Validates status codes and throws detailed errors on mismatch

#### `logger.ts`

The APILogger class provides logging capabilities for API requests and responses.

Key features:

- Logs request details (method, URL, headers, body)
- Logs response details (status code, body)
- Provides formatted output of recent API activity
- Used by RequestHandler for error reporting

Methods:

- `logRequest()`: Logs API request with method, URL, headers, and optional body
- `logResponse()`: Logs API response with status code and optional body
- `getRecentLogs()`: Returns formatted string of all recent API activity

#### `fixtures.ts`

Defines Playwright test fixtures that provide pre-configured utilities to tests.

Key features:

- Custom `api` fixture that provides a pre-configured RequestHandler instance
- TypeScript type definitions for test options
- Integration with Playwright's test runner
- Automatic logger initialization

The fixture:

- Creates a RequestHandler with the base URL (`https://conduit-api.bondaracademy.com/api`)
- Creates an APILogger instance for logging
- Makes the `api` fixture available in all tests
- Handles cleanup and lifecycle management

### `playwright.config.ts`

Configuration file for Playwright test runner.

Key configurations:

- Test directory: `./tests`
- Parallel test execution enabled
- Retry configuration for CI environments (2 retries in CI, 0 locally)
- HTML and list reporters
- Custom project configuration for API testing (no browser devices)
- Trace collection on first retry

Notable settings:

- `testDir`: Points to the tests directory
- `fullyParallel`: Enables parallel test execution
- `forbidOnly`: Fails tests marked with `.only` in CI
- `retries`: Number of retries for failed tests (2 in CI, 0 locally)
- `workers`: Number of parallel workers (1 in CI, auto locally)
- `reporter`: Configures HTML and list reporters
- `trace`: Collects traces on first retry
- `projects`: Defines an "api-testing" project without browser-specific settings

### `package.json`

Node.js package configuration file.

Key sections:

- **Name**: `playwright-api`
- **Version**: `1.0.0`
- **License**: ISC
- **Repository**: Git repository URL (https://github.com/Ezra31448/playwright-api.git)
- **Dependencies**: None (all dependencies are devDependencies)
- **DevDependencies**:
  - `@playwright/test`: The Playwright testing framework (v1.58.0)
  - `@types/node`: TypeScript definitions for Node.js (v25.0.10)

### `.gitignore`

Git ignore file that specifies which files and directories should be ignored by Git.

## Data Flow

### Test Execution Flow

1. Playwright test runner loads [`playwright.config.ts`](../playwright.config.ts:1)
2. Test fixtures from [`utils/fixtures.ts`](../utils/fixtures.ts:1) are initialized
3. The `api` fixture creates:
   - An APILogger instance for logging
   - A RequestHandler instance with the base URL and logger
4. Tests use the `api` fixture to make API calls
5. RequestHandler logs requests via APILogger before execution
6. RequestHandler builds the request and executes it via Playwright's APIRequestContext
7. RequestHandler logs responses via APILogger after execution
8. Responses are validated against expected status codes
9. If validation fails, RequestHandler throws an error with recent API logs
10. Test assertions verify expected behavior
11. Fixtures are cleaned up after test completion

### RequestHandler Flow

1. Test calls methods on the `api` fixture (RequestHandler instance)
2. Each method call modifies the internal state of the RequestHandler:
   - `url()` sets custom base URL
   - `path()` sets API endpoint path
   - `params()` sets query parameters
   - `header()` sets request headers
   - `body()` sets request body
3. When an HTTP method is called (`getRequest()`, `postRequest()`, `putRequest()`, `deleteRequest()`):
   - `getUrl()` constructs the complete URL from base URL, path, and query parameters
   - APILogger logs the request details
   - Request is made with configured headers and body via Playwright's APIRequestContext
   - APILogger logs the response details
   - Response status code is validated against expected value
   - If validation fails, `statusCodeValidator()` throws an error with recent API logs
   - JSON response body is parsed and returned (or null for 204 No Content)

### APILogger Flow

1. RequestHandler creates an APILogger instance on initialization
2. Before each API request, RequestHandler calls `logRequest()` with:
   - HTTP method
   - Complete URL
   - Request headers
   - Request body (for POST, PUT, DELETE)
3. After each API response, RequestHandler calls `logResponse()` with:
   - Response status code
   - Response body (if present)
4. If status code validation fails, RequestHandler calls `getRecentLogs()` to get formatted logs
5. The formatted logs are included in the error message for debugging

## Extension Points

The framework is designed to be extensible in several ways:

### Adding New HTTP Methods

The RequestHandler can be extended with additional HTTP methods (e.g., PATCH):

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

### Adding New Fixtures

Additional fixtures can be added to [`fixtures.ts`](../utils/fixtures.ts:1):

```typescript
export type TestOptions = {
  api: RequestHandler;
  authenticatedApi: RequestHandler; // New fixture with auth
};

export const test = base.extend<TestOptions>({
  // Existing api fixture...

  authenticatedApi: async ({ request }, use) => {
    const baseUrl: string = "https://conduit-api.bondaracademy.com/api";
    const logger = new APILogger();
    const requestHandler = new RequestHandler(request, baseUrl, logger);

    // Authenticate
    const loginResponse = await request.post(`${baseUrl}/users/login`, {
      data: {
        user: {
          email: process.env.API_USERNAME,
          password: process.env.API_PASSWORD,
        },
      },
    });

    const token = (await loginResponse.json()).user.token;
    requestHandler.header({ Authorization: `Token ${token}` });

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

### Custom Logger Implementations

You can create custom logger implementations:

```typescript
// utils/file-logger.ts
export class FileLogger {
  private logs: any[] = [];

  logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: any,
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      headers,
      body,
    };
    this.logs.push({ type: "Request", data: logEntry });
    // Write to file
    fs.appendFileSync("api-logs.txt", JSON.stringify(logEntry) + "\n");
  }

  logResponse(status: number, body?: any) {
    const logEntry = { timestamp: new Date().toISOString(), status, body };
    this.logs.push({ type: "Response", data: logEntry });
    // Write to file
    fs.appendFileSync("api-logs.txt", JSON.stringify(logEntry) + "\n");
  }

  getRecentLogs() {
    return this.logs.map((log) => JSON.stringify(log)).join("\n");
  }
}
```

## Best Practices for Structure

1. **Keep tests focused**: Each test file should focus on a specific API endpoint or feature
2. **Use descriptive names**: File names should clearly indicate what they test
3. **Separate concerns**: Keep utilities, fixtures, and tests in separate directories
4. **Document extensions**: When adding new utilities or fixtures, document them appropriately
5. **Maintain consistency**: Follow existing patterns when adding new code
6. **Use fixtures**: Leverage the custom fixtures for consistent test setup
7. **Log appropriately**: The APILogger is automatically used by RequestHandler for debugging

## Future Enhancements

Potential improvements to the project structure:

1. **Test data directory**: Add a `fixtures/` directory for test data files
2. **Environment configs**: Add environment-specific configuration files (.env, .env.staging, etc.)
3. **Custom reporters**: Implement custom test reporters for specific needs
4. **Test utilities**: Expand the `utils/` directory with more helper classes
5. **Type definitions**: Add more comprehensive TypeScript type definitions for API responses
6. **Test scripts**: Add npm scripts for common test operations (e.g., `npm run test:smoke`)
7. **Mock server**: Add a mock API server for local development and testing
8. **CI/CD pipelines**: Add GitHub Actions or other CI/CD configuration files
