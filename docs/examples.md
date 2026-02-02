# API Testing Examples

This document provides practical examples of common API testing scenarios using the Playwright API testing framework.

## Table of Contents

1. [Basic GET Requests](#basic-get-requests)
2. [POST Requests with Body Data](#post-requests-with-body-data)
3. [Authentication Scenarios](#authentication-scenarios)
4. [CRUD Operations](#crud-operations)
5. [Error Handling](#error-handling)
6. [Query Parameters and Filtering](#query-parameters-and-filtering)
7. [File Upload](#file-upload)
8. [Pagination Testing](#pagination-testing)
9. [Rate Limiting Testing](#rate-limiting-testing)
10. [Concurrent Requests](#concurrent-requests)

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

## POST Requests with Body Data

### Creating a Resource

```typescript
import { test, request } from "@playwright/test";

test("should create a new article", async ({ request }) => {
  const articleData = {
    article: {
      title: "Test Article",
      description: "This is a test article",
      body: "Article body content goes here",
      tagList: ["test", "playwright"],
    },
  };

  const response = await request.post("https://api.example.com/articles", {
    data: articleData,
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  });

  expect(response.status()).toEqual(201);

  const responseData = await response.json();
  expect(responseData.article.title).toEqual(articleData.article.title);
  expect(responseData.article.tagList).toEqual(articleData.article.tagList);
});
```

### POST Request with Form Data

```typescript
test("should submit form data", async ({ request }) => {
  const formData = new URLSearchParams();
  formData.append("username", "testuser");
  formData.append("password", "testpass");
  formData.append("remember", "true");

  const response = await request.post("https://api.example.com/login", {
    data: formData.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  expect(response.status()).toEqual(200);
});
```

## Authentication Scenarios

### Token-Based Authentication

```typescript
import { test, request } from "@playwright/test";

let authToken: string;

test.beforeAll("authenticate user", async ({ request }) => {
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

test("should access protected resource with token", async ({ request }) => {
  const response = await request.get("https://api.example.com/user", {
    headers: {
      Authorization: authToken,
    },
  });

  expect(response.status()).toEqual(200);

  const userData = await response.json();
  expect(userData.user.email).toEqual("test@example.com");
});
```

### API Key Authentication

```typescript
test("should access resource with API key", async ({ request }) => {
  const response = await request.get("https://api.example.com/data", {
    headers: {
      "X-API-Key": "your-api-key-here",
    },
  });

  expect(response.status()).toEqual(200);
});
```

### OAuth2 Authentication

```typescript
test("should authenticate with OAuth2", async ({ request }) => {
  // First, get the OAuth token
  const tokenResponse = await request.post(
    "https://auth.example.com/oauth/token",
    {
      data: {
        grant_type: "client_credentials",
        client_id: "your-client-id",
        client_secret: "your-client-secret",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Use the token to access protected resources
  const response = await request.get("https://api.example.com/protected", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  expect(response.status()).toEqual(200);
});
```

## CRUD Operations

### Complete CRUD Example

```typescript
test.describe("Article CRUD Operations", () => {
  let articleSlug: string;
  let authToken: string;

  test.beforeAll("setup authentication", async ({ request }) => {
    // Authentication setup as shown in previous examples
    authToken = await getAuthToken(request);
  });

  test("should create article", async ({ request }) => {
    const articleData = {
      article: {
        title: "CRUD Test Article",
        description: "Article for testing CRUD operations",
        body: "This article tests all CRUD operations",
        tagList: ["crud", "test"],
      },
    };

    const response = await request.post("https://api.example.com/articles", {
      data: articleData,
      headers: { Authorization: authToken },
    });

    expect(response.status()).toEqual(201);

    const createdArticle = (await response.json()).article;
    articleSlug = createdArticle.slug;

    expect(createdArticle.title).toEqual(articleData.article.title);
  });

  test("should read article", async ({ request }) => {
    const response = await request.get(
      `https://api.example.com/articles/${articleSlug}`,
      { headers: { Authorization: authToken } },
    );

    expect(response.status()).toEqual(200);

    const article = (await response.json()).article;
    expect(article.slug).toEqual(articleSlug);
    expect(article.title).toEqual("CRUD Test Article");
  });

  test("should update article", async ({ request }) => {
    const updateData = {
      article: {
        title: "Updated CRUD Test Article",
        description: "Updated article description",
      },
    };

    const response = await request.put(
      `https://api.example.com/articles/${articleSlug}`,
      {
        data: updateData,
        headers: { Authorization: authToken },
      },
    );

    expect(response.status()).toEqual(200);

    const updatedArticle = (await response.json()).article;
    expect(updatedArticle.title).toEqual(updateData.article.title);
    expect(updatedArticle.description).toEqual(updateData.article.description);
  });

  test("should delete article", async ({ request }) => {
    const response = await request.delete(
      `https://api.example.com/articles/${articleSlug}`,
      { headers: { Authorization: authToken } },
    );

    expect(response.status()).toEqual(204);

    // Verify deletion
    const getResponse = await request.get(
      `https://api.example.com/articles/${articleSlug}`,
    );
    expect(getResponse.status()).toEqual(404);
  });
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
test("should return 401 for unauthorized access", async ({ request }) => {
  const response = await request.get("https://api.example.com/user");

  expect(response.status()).toEqual(401);

  const errorData = await response.json();
  expect(errorData.error).toBeDefined();
});
```

### Testing 400 Bad Request

```typescript
test("should return 400 for invalid data", async ({ request }) => {
  const invalidData = {
    article: {
      title: "", // Empty title should cause validation error
      description: "Valid description",
    },
  };

  const response = await request.post("https://api.example.com/articles", {
    data: invalidData,
    headers: { Authorization: authToken },
  });

  expect(response.status()).toEqual(400);

  const errorData = await response.json();
  expect(errorData.errors).toBeDefined();
  expect(errorData.errors.title).toBeDefined();
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
test("should filter articles by date range", async ({ api }) => {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const response = await api
    .path("/articles")
    .params({
      from: lastWeek.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    })
    .getRequest(200);

  expect(response.articles).toBeDefined();

  // Verify all articles are within the date range
  response.articles.forEach((article) => {
    const articleDate = new Date(article.createdAt);
    expect(articleDate).toBeGreaterThanOrEqual(lastWeek);
    expect(articleDate).toBeLessThanOrEqual(today);
  });
});
```

## File Upload

### Uploading a Single File

```typescript
test("should upload a file", async ({ request }) => {
  const fileBuffer = fs.readFileSync("./test-files/sample.pdf");

  const response = await request.post("https://api.example.com/upload", {
    multipart: {
      file: {
        name: "sample.pdf",
        mimeType: "application/pdf",
        buffer: fileBuffer,
      },
      description: "Test file upload",
    },
  });

  expect(response.status()).toEqual(201);

  const uploadData = await response.json();
  expect(uploadData.filename).toEqual("sample.pdf");
  expect(uploadData.url).toBeDefined();
});
```

### Uploading Multiple Files

```typescript
test("should upload multiple files", async ({ request }) => {
  const file1Buffer = fs.readFileSync("./test-files/file1.txt");
  const file2Buffer = fs.readFileSync("./test-files/file2.jpg");

  const response = await request.post(
    "https://api.example.com/upload-multiple",
    {
      multipart: {
        "files[]": [
          {
            name: "file1.txt",
            mimeType: "text/plain",
            buffer: file1Buffer,
          },
          {
            name: "file2.jpg",
            mimeType: "image/jpeg",
            buffer: file2Buffer,
          },
        ],
      },
    },
  );

  expect(response.status()).toEqual(201);

  const uploadData = await response.json();
  expect(uploadData.files).toHaveLength(2);
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

### Testing Edge Cases

```typescript
test.describe("Pagination Edge Cases", () => {
  test("should handle empty page", async ({ api }) => {
    const response = await api
      .path("/articles")
      .params({ limit: 10, offset: 999999 })
      .getRequest(200);

    expect(response.articles).toEqual([]);
    expect(response.articlesCount).toBeGreaterThanOrEqual(0);
  });

  test("should handle invalid page size", async ({ api }) => {
    const response = await api
      .path("/articles")
      .params({ limit: -1, offset: 0 })
      .getRequest(400);

    expect(response.error).toBeDefined();
  });
});
```

## Rate Limiting Testing

### Testing Normal Rate Limits

```typescript
test("should handle normal request rate", async ({ api }) => {
  const promises = [];

  // Make 10 requests quickly
  for (let i = 0; i < 10; i++) {
    promises.push(api.path("/articles").getRequest(200));
  }

  const responses = await Promise.all(promises);

  // All should succeed
  responses.forEach((response) => {
    expect(response.articles).toBeDefined();
  });
});
```

### Testing Rate Limit Exceeded

```typescript
test("should handle rate limit exceeded", async ({ api }) => {
  const promises = [];

  // Make many requests quickly to trigger rate limit
  for (let i = 0; i < 100; i++) {
    promises.push(
      api
        .path("/articles")
        .getRequest(200)
        .catch((error) => error),
    );
  }

  const responses = await Promise.all(promises);

  // Some should fail with rate limit error
  const rateLimitErrors = responses.filter(
    (response) => response.status && response.status === 429,
  );

  expect(rateLimitErrors.length).toBeGreaterThan(0);

  // Check rate limit headers
  const rateLimitError = rateLimitErrors[0];
  expect(rateLimitError.headers).toHaveProperty("x-ratelimit-limit");
  expect(rateLimitError.headers).toHaveProperty("x-ratelimit-remaining");
  expect(rateLimitError.headers).toHaveProperty("x-ratelimit-reset");
});
```

## Concurrent Requests

### Testing Concurrent Requests

```typescript
test("should handle concurrent requests", async ({ api }) => {
  const concurrentRequests = 20;
  const promises = [];

  // Create multiple concurrent requests
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      api
        .path("/articles")
        .params({ limit: 5, offset: i * 5 })
        .getRequest(200),
    );
  }

  const startTime = Date.now();
  const responses = await Promise.all(promises);
  const endTime = Date.now();

  // All requests should succeed
  responses.forEach((response) => {
    expect(response.articles).toBeDefined();
  });

  // Concurrent requests should be faster than sequential
  const totalTime = endTime - startTime;
  console.log(
    `Total time for ${concurrentRequests} concurrent requests: ${totalTime}ms`,
  );
});
```

### Testing Race Conditions

```typescript
test("should handle concurrent resource creation", async ({ request }) => {
  const promises = [];
  const articleData = {
    article: {
      title: "Concurrent Test Article",
      description: "Testing concurrent creation",
      body: "Article body",
      tagList: ["concurrent", "test"],
    },
  };

  // Create multiple articles concurrently
  for (let i = 0; i < 5; i++) {
    promises.push(
      request.post("https://api.example.com/articles", {
        data: {
          ...articleData,
          article: {
            ...articleData.article,
            title: `${articleData.article.title} ${i}`,
          },
        },
        headers: { Authorization: authToken },
      }),
    );
  }

  const responses = await Promise.all(promises);

  // All should succeed
  responses.forEach((response) => {
    expect(response.status()).toEqual(201);
  });

  // Verify all articles were created with unique titles
  const createdArticles = await Promise.all(
    responses.map((response) => response.json()),
  );

  const titles = createdArticles.map((data) => data.article.title);
  const uniqueTitles = [...new Set(titles)];

  expect(titles.length).toEqual(uniqueTitles.length);
});
```

These examples cover a wide range of common API testing scenarios. You can adapt them to your specific API endpoints and requirements. Remember to replace the example URLs, data structures, and authentication methods with those that match your actual API.
