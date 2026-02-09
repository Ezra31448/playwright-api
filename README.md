# Playwright API Testing Framework

A robust API testing framework built with Playwright that provides utilities and patterns for efficient API testing.

## Overview

This project is a specialized API testing framework that leverages Playwright's testing capabilities with custom utilities designed to simplify API testing workflows. It includes a custom [`RequestHandler`](utils/request-handler.ts:5) class that provides a fluent interface for making API requests and handling responses, along with an integrated [`APILogger`](utils/logger.ts:1) for detailed request/response logging.

## Features

- **Custom RequestHandler**: Fluent API for building and executing HTTP requests (GET, POST, PUT, DELETE)
- **Test Fixtures**: Pre-configured test fixtures for seamless integration with Playwright
- **API Logging**: Built-in logging for requests and responses with detailed error reporting
- **Authentication Support**: Built-in support for token-based authentication
- **Response Validation**: Simplified response status code validation with automatic assertion
- **Query Parameter Handling**: Easy management of URL query parameters
- **Header Management**: Flexible header configuration for requests
- **Error Messages**: Detailed error messages including recent API activity logs

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Ezra31448/playwright-api.git
cd playwright-api
```

2. Install dependencies:

```bash
npm install
```

This will install:
- `@playwright/test`: The Playwright testing framework (v1.58.0)
- `@types/node`: TypeScript type definitions for Node.js (v25.0.10)

3. Install Playwright browsers (required for test execution):

```bash
npx playwright install
```

## Quick Start

### Basic GET Request

Create a new test file in the `tests/` directory:

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

test("Get API Data", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 10, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(10);
});
```

### Test with Authentication

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

let authToken: string;

test.beforeAll("Setup authentication", async ({ api }) => {
  const tokenResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "test@example.com",
        password: "password",
      },
    })
    .postRequest(200);

  authToken = "Token " + tokenResponse.user.token;
});

test("Create and verify resource", async ({ api }) => {
  const createResponse = await api
    .path("/articles")
    .body({
      article: {
        title: "Test Article",
        description: "Test Description",
        body: "Article body content",
        tagList: ["test"],
      },
    })
    .header({ Authorization: authToken })
    .postRequest(201);

  expect(createResponse.article.title).toEqual("Test Article");
});
```

### Full CRUD Operations

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

let authToken: string;

test.beforeAll("Setup authentication", async ({ api }) => {
  const tokenResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "test@example.com",
        password: "password",
      },
    })
    .postRequest(200);

  authToken = "Token " + tokenResponse.user.token;
});

test("Create, Read, Update, Delete Article", async ({ api }) => {
  // Create
  const createResponse = await api
    .path("/articles")
    .body({
      article: {
        title: "Test Article",
        description: "Test Description",
        body: "Article body content",
        tagList: ["test"],
      },
    })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slugId = createResponse.article.slug;

  // Read
  const getResponse = await api
    .path(`/articles/${slugId}`)
    .getRequest(200);

  expect(getResponse.article.title).toEqual("Test Article");

  // Update
  const updateResponse = await api
    .path(`/articles/${slugId}`)
    .body({
      article: {
        title: "Updated Test Article",
        description: "Updated Description",
      },
    })
    .header({ Authorization: authToken })
    .putRequest(200);

  expect(updateResponse.article.title).toEqual("Updated Test Article");

  // Delete
  await api
    .path(`/articles/${slugId}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/example.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Run tests with UI (Playwright Inspector)
npx playwright test --ui

# Generate HTML test report
npx playwright test --reporter=html

# View HTML report
npx playwright show-report
```

## Project Structure

```
playwright-api/
├── docs/                    # Detailed documentation
│   ├── api-reference.md      # RequestHandler and APILogger class documentation
│   ├── contributing.md      # Contribution guidelines
│   ├── examples.md          # Common API testing scenarios
│   ├── project-structure.md # Detailed explanation of components
│   ├── setup-configuration.md # Environment setup guide
│   └── testing-patterns.md  # Best practices for API testing
├── tests/                   # Test files
│   ├── example.spec.ts      # Example test cases using direct Playwright API
│   └── smokeTest.spec.ts    # Smoke tests using RequestHandler
├── utils/                   # Utility classes and fixtures
│   ├── fixtures.ts          # Playwright test fixtures
│   ├── logger.ts            # APILogger class for request/response logging
│   └── request-handler.ts   # Custom RequestHandler class
├── playwright.config.ts     # Playwright configuration
├── package.json             # Project dependencies
├── package-lock.json        # Lock file for exact dependency versions
├── .gitignore               # Git ignore file
└── README.md                # This file
```

## Documentation

For detailed documentation, see the [docs/](./docs/) directory:

- [API Reference](./docs/api-reference.md) - RequestHandler and APILogger class documentation
- [Testing Patterns](./docs/testing-patterns.md) - Best practices for API testing
- [Project Structure](./docs/project-structure.md) - Detailed explanation of components
- [Setup & Configuration](./docs/setup-configuration.md) - Environment setup guide
- [Examples](./docs/examples.md) - Common API testing scenarios
- [Contributing](./docs/contributing.md) - Guidelines for contributors

## License

This project is licensed under the ISC License.
