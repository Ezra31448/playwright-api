# Playwright API Testing Framework

A robust API testing framework built with Playwright that provides utilities and patterns for efficient API testing.

## Overview

This project is a specialized API testing framework that leverages Playwright's testing capabilities with custom utilities designed to simplify API testing workflows. It includes a custom RequestHandler class that provides a fluent interface for making API requests and handling responses.

## Features

- **Custom RequestHandler**: Fluent API for building and executing HTTP requests
- **Test Fixtures**: Pre-configured test fixtures for seamless integration with Playwright
- **Authentication Support**: Built-in support for token-based authentication
- **Response Validation**: Simplified response status code validation
- **Query Parameter Handling**: Easy management of URL query parameters
- **Header Management**: Flexible header configuration for requests

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

3. Install Playwright browsers (required for test execution):

```bash
npx playwright install
```

## Quick Start

### Basic API Test

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
import { test, request } from "@playwright/test";

let authToken: string;

test.beforeAll("Setup authentication", async ({ request }) => {
  const tokenResponse = await request.post(
    "https://api.example.com/users/login",
    {
      data: {
        user: {
          email: "test@example.com",
          password: "password",
        },
      },
    },
  );
  const tokenResponseJSON = await tokenResponse.json();
  authToken = "Token " + tokenResponseJSON.user.token;
});

test("Create and verify resource", async ({ request }) => {
  const createResponse = await request.post(
    "https://api.example.com/articles",
    {
      data: {
        article: {
          title: "Test Article",
          description: "Test Description",
          body: "Article body content",
          tagList: ["test"],
        },
      },
      headers: {
        Authorization: authToken,
      },
    },
  );

  expect(createResponse.status()).toEqual(201);
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/example.spec.ts

# Run tests in headed mode (for debugging)
npx playwright test --headed

# Generate test report
npx playwright test --reporter=html
```

## Project Structure

```
playwright-api/
├── docs/                    # Detailed documentation
├── tests/                   # Test files
│   ├── example.spec.ts      # Example test cases
│   └── smokeTest.spec.ts    # Smoke tests
├── utils/                   # Utility classes and fixtures
│   ├── fixtures.ts          # Playwright test fixtures
│   └── request-handler.ts   # Custom RequestHandler class
├── playwright.config.ts     # Playwright configuration
├── package.json             # Project dependencies
└── README.md                # This file
```

## Documentation

For detailed documentation, see the [docs/](./docs/) directory:

- [API Reference](./docs/api-reference.md) - RequestHandler class documentation
- [Testing Patterns](./docs/testing-patterns.md) - Best practices for API testing
- [Project Structure](./docs/project-structure.md) - Detailed explanation of components
- [Setup & Configuration](./docs/setup-configuration.md) - Environment setup guide
- [Examples](./docs/examples.md) - Common API testing scenarios
- [Contributing](./docs/contributing.md) - Guidelines for contributors

## License

This project is licensed under the ISC License.
