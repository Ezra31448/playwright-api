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
    "https://api.example.com/users/login",
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
  const response = await request.post("https://api.example.com/users/login", {
    data: {
      user: { email, password },
    },
  });

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

## Request/Response Validation

### Validate Status Codes First

Always validate status codes before checking response body:

```typescript
test("should create article successfully", async ({ request }) => {
  const response = await request.post("https://api.example.com/articles", {
    data: { article: { title: "Test Article" } },
    headers: { Authorization: authToken },
  });

  // Validate status first
  expect(response.status()).toEqual(201);

  // Then validate body
  const responseData = await response.json();
  expect(responseData.article.title).toEqual("Test Article");
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
test("should create article with expected properties", async ({ request }) => {
  const createResponse = await request.post(
    "https://api.example.com/articles",
    {
      data: {
        article: {
          title: "Test Article",
          description: "Test Description",
          body: "Test Body",
          tagList: ["test", "example"],
        },
      },
      headers: { Authorization: authToken },
    },
  );

  const createdArticle = (await createResponse.json()).article;

  expect(createdArticle).toEqual(
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
test("should create article with custom title", async ({ request }) => {
  const articleData = createArticleData({
    title: "Custom Title Article",
    tagList: ["custom", "test"],
  });

  const response = await request.post("https://api.example.com/articles", {
    data: { article: articleData },
    headers: { Authorization: authToken },
  });

  expect(response.status()).toEqual(201);
});
```

### Clean Up Test Data

Always clean up created data to avoid test pollution:

```typescript
test("should create and delete article", async ({ request }) => {
  // Create article
  const createResponse = await request.post(
    "https://api.example.com/articles",
    {
      data: { article: createArticleData() },
      headers: { Authorization: authToken },
    },
  );

  const slug = (await createResponse.json()).article.slug;

  // Verify creation
  expect(createResponse.status()).toEqual(201);

  // Clean up
  const deleteResponse = await request.delete(
    `https://api.example.com/articles/${slug}`,
    { headers: { Authorization: authToken } },
  );

  expect(deleteResponse.status()).toEqual(204);
});
```

## Error Handling

### Test Error Scenarios

Explicitly test error conditions:

```typescript
test.describe("Error Handling", () => {
  test("should return 401 for unauthorized access", async ({ api }) => {
    // Try to access protected resource without auth
    const response = await api.path("/user/profile").getRequest(401);
  });

  test("should return 404 for non-existent resource", async ({ api }) => {
    const response = await api
      .path("/articles/non-existent-slug")
      .getRequest(404);
  });

  test("should return 400 for invalid data", async ({ request }) => {
    const response = await request.post("https://api.example.com/articles", {
      data: { article: { title: "" } }, // Invalid: empty title
      headers: { Authorization: authToken },
    });

    expect(response.status()).toEqual(400);

    const errorData = await response.json();
    expect(errorData.errors).toBeDefined();
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

## Test Isolation

### Avoid Test Dependencies

Tests should be independent and not rely on other tests:

```typescript
// Bad: Test depends on previous test creating data
test("should create article", async ({ request }) => {
  // Creates article with slug "test-article"
});

test("should update article", async ({ request }) => {
  // Assumes article with slug "test-article" exists
  // This is fragile!
});

// Good: Each test is self-contained
test("should create and update article", async ({ request }) => {
  // Create article
  const createResponse = await request.post(
    "https://api.example.com/articles",
    {
      data: { article: createArticleData() },
      headers: { Authorization: authToken },
    },
  );

  const slug = (await createResponse.json()).article.slug;

  // Update the same article
  const updateResponse = await request.put(
    `https://api.example.com/articles/${slug}`,
    {
      data: { article: { title: "Updated Title" } },
      headers: { Authorization: authToken },
    },
  );

  expect(updateResponse.status()).toEqual(200);

  // Clean up
  await request.delete(`https://api.example.com/articles/${slug}`, {
    headers: { Authorization: authToken },
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

  test.beforeAll("Setup auth", async ({ request }) => {
    authToken = await authenticateUser(request, "test@example.com", "password");
  });

  test.beforeEach("Reset test state", async ({ request }) => {
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
