# Testing Patterns and Best Practices

This guide covers recommended patterns and best practices for API testing using this Playwright-based framework.

## Table of Contents

1. [Test Organization](#test-organization)
2. [Authentication Patterns](#authentication-patterns)
3. [Request/Response Validation](#requestresponse-validation)
4. [Data Management](#data-management)
5. [Error Handling](#error-handling)
6. [Test Isolation](#test-isolation)
7. [Assertion Strategies](#assertion-strategies)
8. [Performance Considerations](#performance-considerations)
9. [Logging and Debugging](#logging-and-debugging)

## Test Organization

### Group Related Tests

Organize tests by API endpoints or functionality:

```typescript
// tests/articles.spec.ts
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

test.describe("Articles API", () => {
  test("should get all articles", async ({ api }) => {
    const response = await api
      .path("/articles")
      .params({ limit: 10, offset: 0 })
      .getRequest(200);

    expect(response.articles).toBeDefined();
    expect(response.articles.length).toBeLessThanOrEqual(10);
  });

  test("should get single article", async ({ api }) => {
    const response = await api
      .path("/articles/test-article-slug")
      .getRequest(200);

    expect(response.article).toBeDefined();
    expect(response.article.slug).toEqual("test-article-slug");
  });
});
```

### Use Descriptive Test Names

Make test names descriptive and focused on behavior:

```typescript
// Good
test("should return 404 when requesting non-existent article", async ({
  api,
}) => {
  // test implementation
});

// Avoid
test("article test", async ({ api }) => {
  // test implementation
});
```

## Authentication Patterns

### Setup Authentication in beforeAll

For tests requiring authentication, set up tokens once per test file:

```typescript
import { test, request } from "@playwright/test";

let authToken: string;

test.beforeAll("Setup authentication", async ({ request }) => {
  const loginResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: {
          email: "test@example.com",
          password: "password123",
        },
      },
    },
  );

  const loginData = await loginResponse.json();
  authToken = `Token ${loginData.user.token}`;

  expect(loginResponse.status()).toEqual(200);
  expect(authToken).toBeDefined();
});
```

### Create Authentication Helper

For complex authentication scenarios, create a helper function:

```typescript
// utils/auth-helper.ts
export async function authenticateUser(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email, password },
      },
    },
  );

  const data = await response.json();
  return `Token ${data.user.token}`;
}

// Usage in tests
test.beforeAll("Setup authentication", async ({ request }) => {
  authToken = await authenticateUser(
    request,
    "test@example.com",
    "password123",
  );
});
```

### Use RequestHandler for Authentication

The RequestHandler provides a fluent interface for authentication:

```typescript
import { test } from "../utils/fixtures";

let authToken: string;

test.beforeAll("Setup authentication", async ({ api }) => {
  const tokenResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "test@example.com",
        password: "password123",
      },
    })
    .postRequest(200);

  authToken = "Token " + tokenResponse.user.token;
});

test("should access protected resource", async ({ api }) => {
  const response = await api
    .path("/user")
    .header({ Authorization: authToken })
    .getRequest(200);

  expect(response.user).toBeDefined();
});
```

## Request/Response Validation

### Validate Status Codes First

Always validate status codes before checking response body:

```typescript
test("should create article successfully", async ({ api }) => {
  const response = await api
    .path("/articles")
    .body({ article: { title: "Test Article" } })
    .header({ Authorization: authToken })
    .postRequest(201);

  // Status is automatically validated by RequestHandler
  // Now validate body
  expect(response.article.title).toEqual("Test Article");
});
```

### Validate Response Structure

Validate the structure of responses before checking specific values:

```typescript
test("should return valid article structure", async ({ api }) => {
  const response = await api.path("/articles/test").getRequest(200);

  // Check structure
  expect(response.article).toBeDefined();
  expect(response.article).toHaveProperty("title");
  expect(response.article).toHaveProperty("description");
  expect(response.article).toHaveProperty("body");
  expect(response.article).toHaveProperty("tagList");
  expect(response.article).toHaveProperty("createdAt");

  // Then check values
  expect(response.article.title).toBeTypeOf("string");
  expect(Array.isArray(response.article.tagList)).toBeTruthy();
});
```

### Use Partial Object Matching

For complex objects, validate only the properties you care about:

```typescript
test("should create article with expected properties", async ({ api }) => {
  const response = await api
    .path("/articles")
    .body({
      article: {
        title: "Test Article",
        description: "Test Description",
        body: "Test Body",
        tagList: ["test", "example"],
      },
    })
    .header({ Authorization: authToken })
    .postRequest(201);

  expect(response.article).toEqual(
    expect.objectContaining({
      title: "Test Article",
      description: "Test Description",
      body: "Test Body",
      tagList: ["test", "example"],
    }),
  );

  // Don't test system-generated fields like id, createdAt, etc.
});
```

## Data Management

### Create Test Data Factories

Use factory functions to create test data:

```typescript
// utils/test-data-factory.ts
export function createArticleData(overrides = {}) {
  return {
    title: "Test Article",
    description: "Test Description",
    body: "This is a test article body",
    tagList: ["test"],
    ...overrides,
  };
}

// Usage in tests
test("should create article with custom title", async ({ api }) => {
  const articleData = createArticleData({
    title: "Custom Title Article",
    tagList: ["custom", "test"],
  });

  const response = await api
    .path("/articles")
    .body({ article: articleData })
    .header({ Authorization: authToken })
    .postRequest(201);

  expect(response.status).toEqual(201);
});
```

### Clean Up Test Data

Always clean up created data to avoid test pollution:

```typescript
test("should create and delete article", async ({ api }) => {
  // Create article
  const createResponse = await api
    .path("/articles")
    .body({ article: createArticleData() })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slug = createResponse.article.slug;

  // Verify creation
  expect(createResponse.article.title).toBeDefined();

  // Clean up
  await api
    .path(`/articles/${slug}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

### Use afterEach for Cleanup

For consistent cleanup across tests:

```typescript
test.describe("Article Management", () => {
  let articleSlug: string;

  test.afterEach("Cleanup", async ({ api }) => {
    if (articleSlug) {
      await api
        .path(`/articles/${articleSlug}`)
        .header({ Authorization: authToken })
        .deleteRequest(204);
      articleSlug = "";
    }
  });

  test("should create article", async ({ api }) => {
    const response = await api
      .path("/articles")
      .body({ article: createArticleData() })
      .header({ Authorization: authToken })
      .postRequest(201);

    articleSlug = response.article.slug;
    expect(response.article.title).toBeDefined();
  });
});
```

## Error Handling

### Test Error Scenarios

Explicitly test error conditions:

```typescript
test.describe("Error Handling", () => {
  test("should return 401 for unauthorized access", async ({ api }) => {
    // Try to access protected resource without auth
    const response = await api.path("/user").getRequest(401);
  });

  test("should return 404 for non-existent resource", async ({ api }) => {
    const response = await api
      .path("/articles/non-existent-slug")
      .getRequest(404);
  });

  test("should return 400 for invalid data", async ({ api }) => {
    const response = await api
      .path("/articles")
      .body({ article: { title: "" } }) // Invalid: empty title
      .header({ Authorization: authToken })
      .postRequest(400);

    expect(response.errors).toBeDefined();
  });
});
```

### Validate Error Response Structure

Ensure error responses follow expected format:

```typescript
test("should return properly formatted error", async ({ api }) => {
  const response = await api.path("/non-existent-endpoint").getRequest(404);

  // Error responses should have consistent structure
  expect(response).toEqual(
    expect.objectContaining({
      error: expect.any(String),
    }),
  );
});
```

### Leverage Built-in Error Messages

The RequestHandler provides detailed error messages including recent API logs:

```typescript
test("should handle API errors gracefully", async ({ api }) => {
  try {
    await api.path("/non-existent").getRequest(200);
  } catch (error) {
    // Error message includes:
    // - Expected vs actual status code
    // - Recent API activity logs
    console.error(error.message);
  }
});
```

Example error message:

```
Expected status 200 but got 404

Recent API Activity:
===Request Details===
{
    "method": "GET",
    "url": "https://conduit-api.bondaracademy.com/api/non-existent",
    "headers": {}
}

===Response Details===
{
    "status": 404,
    "body": { "error": "Not Found" }
}
```

## Test Isolation

### Avoid Test Dependencies

Tests should be independent and not rely on other tests:

```typescript
// Bad: Test depends on previous test creating data
test("should create article", async ({ api }) => {
  // Creates article with slug "test-article"
});

test("should update article", async ({ api }) => {
  // Assumes article with slug "test-article" exists
  // This is fragile!
});

// Good: Each test is self-contained
test("should create and update article", async ({ api }) => {
  // Create article
  const createResponse = await api
    .path("/articles")
    .body({ article: createArticleData() })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slug = createResponse.article.slug;

  // Update the same article
  const updateResponse = await api
    .path(`/articles/${slug}`)
    .body({ article: { title: "Updated Title" } })
    .header({ Authorization: authToken })
    .putRequest(200);

  expect(updateResponse.article.title).toEqual("Updated Title");

  // Clean up
  await api
    .path(`/articles/${slug}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

### Use beforeEach for Fresh State

Ensure each test starts with a clean state:

```typescript
test.describe("Article Tests", () => {
  test.beforeEach("Reset state", async ({ api }) => {
    // Reset any test state before each test
  });

  test("should create article", async ({ api }) => {
    // Test with clean state
  });
});
```

## Assertion Strategies

### Use Specific Assertions

Use the most specific assertion available:

```typescript
// Good: Specific assertion
expect(response.articles.length).toBeLessThanOrEqual(10);

// Avoid: Generic assertion
expect(response.articles.length < 11).toBeTruthy();
```

### Assert Multiple Properties

Use `expect.objectContaining` for multiple property checks:

```typescript
// Good: Check multiple properties at once
expect(response.article).toEqual(
  expect.objectContaining({
    title: "Expected Title",
    description: "Expected Description",
    tagList: expect.arrayContaining(["tag1", "tag2"]),
  }),
);

// Avoid: Multiple separate assertions
expect(response.article.title).toEqual("Expected Title");
expect(response.article.description).toEqual("Expected Description");
expect(response.article.tagList).toContain("tag1");
expect(response.article.tagList).toContain("tag2");
```

## Performance Considerations

### Use beforeEach for Repeated Setup

For setup that needs to run before each test:

```typescript
test.describe("Performance Tests", () => {
  let authToken: string;

  test.beforeAll("Setup auth", async ({ api }) => {
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

  test.beforeEach("Reset test state", async ({ api }) => {
    // Reset any test state before each test
  });

  test("should handle large response efficiently", async ({ api }) => {
    const response = await api
      .path("/articles")
      .params({ limit: 1000 })
      .getRequest(200);

    // Performance assertions
    expect(response.articles.length).toEqual(1000);
  });
});
```

### Limit Test Data Size

Be mindful of test data size:

```typescript
// Good: Reasonable test data size
test("should handle paginated responses", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 20, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(20);
});

// Avoid: Unnecessarily large test data
test("should handle huge response", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 100000 }) // Too large for a unit test
    .getRequest(200);
});
```

## Logging and Debugging

### Automatic Request/Response Logging

The RequestHandler automatically logs all requests and responses through the APILogger:

```typescript
test("should log API activity", async ({ api }) => {
  // This request is automatically logged
  const response = await api
    .path("/articles")
    .params({ limit: 10 })
    .getRequest(200);

  // If an error occurs, recent logs are included in the error message
});
```

### Accessing Logs for Debugging

When a test fails, the error message includes recent API activity:

```typescript
test("should demonstrate error logging", async ({ api }) => {
  try {
    // This will fail with 404
    await api.path("/non-existent").getRequest(200);
  } catch (error) {
    // Error message includes detailed logs
    console.error(error.message);
    // Output:
    // Expected status 200 but got 404
    //
    // Recent API Activity:
    // ===Request Details===
    // {
    //   "method": "GET",
    //   "url": "https://conduit-api.bondaracademy.com/api/non-existent",
    //   "headers": {}
    // }
    //
    // ===Response Details===
    // {
    //   "status": 404,
    //   "body": { "error": "Not Found" }
    // }
  }
});
```

### Using Logs for Test Debugging

Logs are particularly useful for debugging complex test scenarios:

```typescript
test("should debug complex API interaction", async ({ api }) => {
  let articleSlug: string;

  // Create article
  const createResponse = await api
    .path("/articles")
    .body({ article: createArticleData() })
    .header({ Authorization: authToken })
    .postRequest(201);

  articleSlug = createResponse.article.slug;

  // Update article
  const updateResponse = await api
    .path(`/articles/${articleSlug}`)
    .body({ article: { title: "Updated" } })
    .header({ Authorization: authToken })
    .putRequest(200);

  // If any step fails, you'll see all previous requests and responses
});
```

### Custom Logging

You can extend the APILogger for custom logging behavior:

```typescript
// utils/custom-logger.ts
import { APILogger } from "./logger";

export class CustomLogger extends APILogger {
  logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: any,
  ) {
    console.log(`[${new Date().toISOString()}] ${method} ${url}`);
    super.logRequest(method, url, headers, body);
  }

  logResponse(status: number, body?: any) {
    console.log(`[${new Date().toISOString()}] Status: ${status}`);
    super.logResponse(status, body);
  }
}
```

## Best Practices Summary

1. **Organize tests logically**: Group related tests using `test.describe()`
2. **Use descriptive names**: Make test names clear and specific
3. **Authenticate properly**: Set up authentication in `beforeAll` or use fixtures
4. **Validate responses**: Check status codes first, then structure, then values
5. **Clean up data**: Always clean up created resources to avoid test pollution
6. **Test error cases**: Explicitly test error scenarios and edge cases
7. **Keep tests isolated**: Each test should be independent and self-contained
8. **Use specific assertions**: Use the most specific assertion for your needs
9. **Leverage logging**: The built-in APILogger provides detailed error messages
10. **Mind performance**: Use reasonable test data sizes and efficient patterns
