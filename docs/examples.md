# API Testing Examples

This document provides practical examples of common API testing scenarios using the Playwright API testing framework with the RequestHandler utility.

## Table of Contents

1. [Basic GET Requests](#basic-get-requests)
2. [POST Requests with Body Data](#post-requests-with-body-data)
3. [Authentication Scenarios](#authentication-scenarios)
4. [CRUD Operations](#crud-operations)
5. [Error Handling](#error-handling)
6. [Query Parameters and Filtering](#query-parameters-and-filtering)
7. [Pagination Testing](#pagination-testing)
8. [Concurrent Requests](#concurrent-requests)

## Basic GET Requests

### Simple GET Request

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

test("should get list of articles", async ({ api }) => {
  const response = await api.path("/articles").getRequest(200);

  expect(response.articles).toBeDefined();
  expect(response.articles.length).toBeGreaterThan(0);
});
```

### GET Request with Query Parameters

```typescript
test("should get articles with pagination", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 5, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(5);
  expect(response.articlesCount).toBeDefined();
});
```

### GET Request with Headers

```typescript
test("should get articles with specific headers", async ({ api }) => {
  const response = await api
    .path("/articles")
    .header({
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    })
    .getRequest(200);

  expect(response.articles).toBeDefined();
});
```

### GET Request with Custom URL

```typescript
test("should use custom base URL", async ({ api }) => {
  const response = await api
    .url("https://custom-api.example.com")
    .path("/articles")
    .getRequest(200);

  expect(response.articles).toBeDefined();
});
```

## POST Requests with Body Data

### Creating a Resource

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

let authToken: string;

test.beforeAll("authenticate user", async ({ api }) => {
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

test("should create a new article", async ({ api }) => {
  const articleData = {
    article: {
      title: "Test Article",
      description: "This is a test article",
      body: "Article body content goes here",
      tagList: ["test", "playwright"],
    },
  };

  const response = await api
    .path("/articles")
    .body(articleData)
    .header({ Authorization: authToken })
    .postRequest(201);

  expect(response.article.title).toEqual(articleData.article.title);
  expect(response.article.tagList).toEqual(articleData.article.tagList);
});
```

### POST Request with Complex Body

```typescript
test("should create article with complex data", async ({ api }) => {
  const articleData = {
    article: {
      title: "Complex Article",
      description: "Article with complex structure",
      body: "# Heading\n\nContent with **markdown**",
      tagList: ["test", "playwright", "api", "testing"],
    },
  };

  const response = await api
    .path("/articles")
    .body(articleData)
    .header({ Authorization: authToken })
    .postRequest(201);

  expect(response.article.title).toEqual("Complex Article");
  expect(response.article.tagList.length).toEqual(4);
});
```

## Authentication Scenarios

### Token-Based Authentication

```typescript
import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";

let authToken: string;

test.beforeAll("authenticate user", async ({ api }) => {
  const tokenResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "test@example.com",
        password: "password123",
      },
    })
    .postRequest(200);

  const tokenData = tokenResponse.user.token;
  authToken = `Token ${tokenData}`;

  expect(authToken).toBeDefined();
});

test("should access protected resource with token", async ({ api }) => {
  const response = await api
    .path("/user")
    .header({ Authorization: authToken })
    .getRequest(200);

  expect(response.user.email).toEqual("test@example.com");
});
```

### Reusing Authentication Across Tests

```typescript
test.describe("Authenticated Tests", () => {
  let authToken: string;

  test.beforeAll("setup authentication", async ({ api }) => {
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

  test("should get user profile", async ({ api }) => {
    const response = await api
      .path("/user")
      .header({ Authorization: authToken })
      .getRequest(200);

    expect(response.user).toBeDefined();
  });

  test("should update user profile", async ({ api }) => {
    const response = await api
      .path("/user")
      .header({ Authorization: authToken })
      .body({
        user: {
          bio: "Updated bio",
        },
      })
      .putRequest(200);

    expect(response.user.bio).toEqual("Updated bio");
  });
});
```

## CRUD Operations

### Complete CRUD Example

```typescript
test.describe("Article CRUD Operations", () => {
  let articleSlug: string;
  let authToken: string;

  test.beforeAll("setup authentication", async ({ api }) => {
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

  test("should create article", async ({ api }) => {
    const articleData = {
      article: {
        title: "CRUD Test Article",
        description: "Article for testing CRUD operations",
        body: "This article tests all CRUD operations",
        tagList: ["crud", "test"],
      },
    };

    const response = await api
      .path("/articles")
      .body(articleData)
      .header({ Authorization: authToken })
      .postRequest(201);

    articleSlug = response.article.slug;

    expect(response.article.title).toEqual(articleData.article.title);
  });

  test("should read article", async ({ api }) => {
    const response = await api.path(`/articles/${articleSlug}`).getRequest(200);

    expect(response.article.slug).toEqual(articleSlug);
    expect(response.article.title).toEqual("CRUD Test Article");
  });

  test("should update article", async ({ api }) => {
    const updateData = {
      article: {
        title: "Updated CRUD Test Article",
        description: "Updated article description",
      },
    };

    const response = await api
      .path(`/articles/${articleSlug}`)
      .body(updateData)
      .header({ Authorization: authToken })
      .putRequest(200);

    expect(response.article.title).toEqual(updateData.article.title);
    expect(response.article.description).toEqual(
      updateData.article.description,
    );
  });

  test("should delete article", async ({ api }) => {
    await api
      .path(`/articles/${articleSlug}`)
      .header({ Authorization: authToken })
      .deleteRequest(204);

    // Verify deletion
    const getResponse = await api
      .path(`/articles/${articleSlug}`)
      .getRequest(404);

    expect(getResponse.error).toBeDefined();
  });
});
```

### Single Test CRUD Operation

```typescript
test("should perform complete CRUD in one test", async ({ api }) => {
  let authToken: string;

  // Authenticate
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

  // Create
  const createResponse = await api
    .path("/articles")
    .body({
      article: {
        title: "Single Test Article",
        description: "Created in single test",
        body: "Test body",
        tagList: ["test"],
      },
    })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slug = createResponse.article.slug;

  // Read
  const getResponse = await api.path(`/articles/${slug}`).getRequest(200);
  expect(getResponse.article.title).toEqual("Single Test Article");

  // Update
  const updateResponse = await api
    .path(`/articles/${slug}`)
    .body({
      article: {
        title: "Updated Single Test Article",
      },
    })
    .header({ Authorization: authToken })
    .putRequest(200);

  expect(updateResponse.article.title).toEqual("Updated Single Test Article");

  // Delete
  await api
    .path(`/articles/${slug}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

## Error Handling

### Testing 404 Not Found

```typescript
test("should return 404 for non-existent article", async ({ api }) => {
  const response = await api
    .path("/articles/non-existent-slug")
    .getRequest(404);

  expect(response.error).toBeDefined();
  expect(response.error.message).toContain("not found");
});
```

### Testing 401 Unauthorized

```typescript
test("should return 401 for unauthorized access", async ({ api }) => {
  const response = await api.path("/user").getRequest(401);

  expect(response.error).toBeDefined();
});
```

### Testing 400 Bad Request

```typescript
test("should return 400 for invalid data", async ({ api }) => {
  const invalidData = {
    article: {
      title: "", // Empty title should cause validation error
      description: "Valid description",
    },
  };

  const response = await api
    .path("/articles")
    .body(invalidData)
    .header({ Authorization: authToken })
    .postRequest(400);

  expect(response.errors).toBeDefined();
  expect(response.errors.title).toBeDefined();
});
```

### Handling Validation Errors

```typescript
test("should handle multiple validation errors", async ({ api }) => {
  const invalidData = {
    article: {
      title: "", // Empty title
      description: "", // Empty description
      body: "", // Empty body
    },
  };

  const response = await api
    .path("/articles")
    .body(invalidData)
    .header({ Authorization: authToken })
    .postRequest(400);

  expect(response.errors).toBeDefined();
  expect(response.errors.title).toBeDefined();
  expect(response.errors.description).toBeDefined();
  expect(response.errors.body).toBeDefined();
});
```

## Query Parameters and Filtering

### Testing Search Functionality

```typescript
test("should search articles by tag", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ tag: "playwright", limit: 10 })
    .getRequest(200);

  expect(response.articles).toBeDefined();

  // Verify all returned articles have the specified tag
  response.articles.forEach((article) => {
    expect(article.tagList).toContain("playwright");
  });
});
```

### Testing Date Range Filtering

```typescript
test("should filter articles by author", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ author: "testuser", limit: 10 })
    .getRequest(200);

  expect(response.articles).toBeDefined();

  // Verify all articles are by the specified author
  response.articles.forEach((article) => {
    expect(article.author.username).toEqual("testuser");
  });
});
```

### Testing Multiple Filters

```typescript
test("should apply multiple filters", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({
      tag: "playwright",
      limit: 5,
      offset: 0,
    })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(5);
  response.articles.forEach((article) => {
    expect(article.tagList).toContain("playwright");
  });
});
```

## Pagination Testing

### Testing First Page

```typescript
test("should get first page of articles", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 5, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(5);
  expect(response.articlesCount).toBeDefined();
  expect(response.articlesCount).toBeGreaterThan(0);
});
```

### Testing Next Pages

```typescript
test("should navigate through pages", async ({ api }) => {
  const pageSize = 5;
  let allArticles = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await api
      .path("/articles")
      .params({ limit: pageSize, offset })
      .getRequest(200);

    const articles = response.articles;
    allArticles.push(...articles);

    if (articles.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  expect(allArticles.length).toEqual(response.articlesCount);
});
```

### Testing Pagination Edge Cases

```typescript
test("should handle pagination edge cases", async ({ api }) => {
  // Test with limit of 0
  const emptyResponse = await api
    .path("/articles")
    .params({ limit: 0, offset: 0 })
    .getRequest(200);

  expect(emptyResponse.articles.length).toEqual(0);

  // Test with offset beyond available data
  const beyondResponse = await api
    .path("/articles")
    .params({ limit: 10, offset: 999999 })
    .getRequest(200);

  expect(beyondResponse.articles.length).toEqual(0);
});
```

## Concurrent Requests

### Parallel Requests

```typescript
test("should handle parallel requests", async ({ api }) => {
  const [articlesResponse, tagsResponse] = await Promise.all([
    api.path("/articles").getRequest(200),
    api.path("/tags").getRequest(200),
  ]);

  expect(articlesResponse.articles).toBeDefined();
  expect(tagsResponse.tags).toBeDefined();
});
```

### Batch Operations

```typescript
test("should perform batch operations", async ({ api }) => {
  const articleIds = ["article-1", "article-2", "article-3"];

  const responses = await Promise.all(
    articleIds.map((id) =>
      api
        .path(`/articles/${id}`)
        .header({ Authorization: authToken })
        .getRequest(200),
    ),
  );

  responses.forEach((response) => {
    expect(response.article).toBeDefined();
  });
});
```

### Rate Limiting Testing

```typescript
test("should handle rate limiting", async ({ api }) => {
  const requests = Array(10)
    .fill(null)
    .map(() => api.path("/articles").getRequest(200));

  const responses = await Promise.all(requests);

  responses.forEach((response) => {
    expect(response.articles).toBeDefined();
  });
});
```

## Advanced Examples

### Chained API Calls

```typescript
test("should chain API calls", async ({ api }) => {
  let authToken: string;

  // Step 1: Login
  const loginResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "test@example.com",
        password: "password123",
      },
    })
    .postRequest(200);

  authToken = "Token " + loginResponse.user.token;

  // Step 2: Create article
  const createResponse = await api
    .path("/articles")
    .body({
      article: {
        title: "Chained Article",
        description: "Created through chained calls",
        body: "Test body",
        tagList: ["test"],
      },
    })
    .header({ Authorization: authToken })
    .postRequest(201);

  const slug = createResponse.article.slug;

  // Step 3: Favorite the article
  const favoriteResponse = await api
    .path(`/articles/${slug}/favorite`)
    .header({ Authorization: authToken })
    .postRequest(200);

  expect(favoriteResponse.article.favorited).toBe(true);

  // Step 4: Unfavorite
  const unfavoriteResponse = await api
    .path(`/articles/${slug}/favorite`)
    .header({ Authorization: authToken })
    .deleteRequest(200);

  expect(unfavoriteResponse.article.favorited).toBe(false);

  // Step 5: Delete article
  await api
    .path(`/articles/${slug}`)
    .header({ Authorization: authToken })
    .deleteRequest(204);
});
```

### Conditional API Calls

```typescript
test("should make conditional API calls", async ({ api }) => {
  // Get articles
  const response = await api
    .path("/articles")
    .params({ limit: 1 })
    .getRequest(200);

  // Check if articles exist
  if (response.articles.length > 0) {
    const article = response.articles[0];

    // Get full article details
    const detailResponse = await api
      .path(`/articles/${article.slug}`)
      .getRequest(200);

    expect(detailResponse.article.slug).toEqual(article.slug);
  }
});
```

### Retry Pattern

```typescript
test("should retry failed requests", async ({ api }) => {
  const maxRetries = 3;
  let attempts = 0;
  let response;

  while (attempts < maxRetries) {
    try {
      response = await api.path("/articles").getRequest(200);
      break; // Success, exit loop
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw error; // Re-throw after max retries
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  expect(response.articles).toBeDefined();
});
```

## Testing with Real API

The examples in this document use the Conduit API (https://conduit-api.bondaracademy.com/api) which is a real API used for testing. When adapting these examples for your own API:

1. Update the base URL in [`utils/fixtures.ts`](../utils/fixtures.ts:11)
2. Adjust the authentication flow to match your API
3. Modify request/response structures to match your API's schema
4. Update test data to be valid for your API

Example of updating the base URL:

```typescript
// utils/fixtures.ts
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    const baseUrl: string =
      process.env.API_BASE_URL || "https://your-api.example.com/api";
    const logger = new APILogger();
    const requestHandler = new RequestHandler(request, baseUrl, logger);
    await use(requestHandler);
  },
});
```
