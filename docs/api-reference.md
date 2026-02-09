# API Reference

This document provides detailed API reference for the core classes in the Playwright API testing framework.

## Table of Contents

1. [RequestHandler Class](#requesthandler-class)
2. [APILogger Class](#apilogger-class)

---

## RequestHandler Class

The [`RequestHandler`](../utils/request-handler.ts:5) class is a utility wrapper around Playwright's `APIRequestContext` that provides a fluent interface for building and executing HTTP requests with built-in logging and status code validation.

### Constructor

```typescript
constructor(request: APIRequestContext, apiBaseUrl: string, logger: APILogger)
```

Creates a new instance of the RequestHandler.

**Parameters:**

- `request`: Playwright's APIRequestContext instance
- `apiBaseUrl`: Base URL for all API requests
- `logger`: APILogger instance for logging requests and responses

**Example:**

```typescript
import { RequestHandler } from "../utils/request-handler";
import { APILogger } from "../utils/logger";

const logger = new APILogger();
const handler = new RequestHandler(request, "https://api.example.com", logger);
```

### Methods

#### url(url: string)

Sets the base URL for the current request. If not set, uses the default base URL from the constructor.

**Parameters:**

- `url`: The URL to use for the request

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
const handler = new RequestHandler(request, "https://api.example.com", logger);
handler.url("https://custom-api.example.com");
```

#### path(path: string)

Sets the API path to append to the base URL.

**Parameters:**

- `path`: The API path (e.g., "/users", "/articles/123")

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api.path("/articles").getRequest(200);
```

#### params(params: object)

Sets query parameters for the request.

**Parameters:**

- `params`: Object containing key-value pairs for query parameters

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api
  .path("/articles")
  .params({ limit: 10, offset: 0, sort: "desc" })
  .getRequest(200);
```

#### header(headers: Record<string, string>)

Sets headers for the request.

**Parameters:**

- `headers`: Object containing key-value pairs for headers

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api
  .path("/protected-resource")
  .header({
    Authorization: "Bearer token123",
    "Content-Type": "application/json",
  })
  .getRequest(200);
```

#### body(body: object)

Sets the request body for POST, PUT, and PATCH requests.

**Parameters:**

- `body`: Object to be serialized as JSON in the request body

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api
  .path("/articles")
  .body({
    article: {
      title: "New Article",
      content: "Article content",
      tags: ["test", "example"],
    },
  })
  .postRequest(201);
```

#### getRequest(expectedStatusCode: number)

Executes a GET request and validates the response status code.

**Parameters:**

- `expectedStatusCode`: Expected HTTP status code (for validation)

**Returns:** Promise resolving to the JSON response body

**Throws:** Error if status code doesn't match expected value (includes recent API logs)

**Example:**

```typescript
const response = await api
  .path("/articles")
  .params({ limit: 5 })
  .getRequest(200);

console.log(response.articles); // Access response data
```

#### postRequest(expectedStatusCode: number)

Executes a POST request and validates the response status code.

**Parameters:**

- `expectedStatusCode`: Expected HTTP status code (for validation)

**Returns:** Promise resolving to the JSON response body

**Throws:** Error if status code doesn't match expected value (includes recent API logs)

**Example:**

```typescript
const response = await api
  .path("/articles")
  .body({
    article: {
      title: "New Article",
      description: "Article description",
      body: "Article body",
      tagList: ["test"],
    },
  })
  .postRequest(201);

console.log(response.article.slug); // Access created resource
```

#### putRequest(expectedStatusCode: number)

Executes a PUT request and validates the response status code.

**Parameters:**

- `expectedStatusCode`: Expected HTTP status code (for validation)

**Returns:** Promise resolving to the JSON response body

**Throws:** Error if status code doesn't match expected value (includes recent API logs)

**Example:**

```typescript
const response = await api
  .path("/articles/test-article-slug")
  .body({
    article: {
      title: "Updated Title",
      description: "Updated description",
    },
  })
  .putRequest(200);

console.log(response.article.title); // Access updated resource
```

#### deleteRequest(expectedStatusCode: number)

Executes a DELETE request and validates the response status code.

**Parameters:**

- `expectedStatusCode`: Expected HTTP status code (for validation)

**Returns:** Promise resolving to the JSON response body (or null for 204 No Content)

**Throws:** Error if status code doesn't match expected value (includes recent API logs)

**Example:**

```typescript
await api
  .path("/articles/test-article-slug")
  .deleteRequest(204);

// Resource is now deleted
```

### Private Methods

#### getUrl()

Constructs the complete URL by combining base URL, path, and query parameters.

**Returns:** Complete URL string

#### statusCodeValidator(actualStatus: number, expectedStatus: number, callingMethod: Function)

Validates that the actual status code matches the expected status code. Throws an error with recent API logs if they don't match.

**Parameters:**

- `actualStatus`: The actual HTTP status code received
- `expectedStatus`: The expected HTTP status code
- `callingMethod`: The method that called the validator (for stack trace)

**Throws:** Error with detailed message including recent API activity logs

---

## APILogger Class

The [`APILogger`](../utils/logger.ts:1) class provides logging capabilities for API requests and responses, enabling detailed tracking of API activity and improved error reporting.

### Constructor

```typescript
constructor()
```

Creates a new instance of the APILogger.

**Example:**

```typescript
import { APILogger } from "../utils/logger";

const logger = new APILogger();
```

### Methods

#### logRequest(method: string, url: string, headers: Record<string, string>, body?: any)

Logs an API request with method, URL, headers, and optional body.

**Parameters:**

- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `url`: The complete URL of the request
- `headers`: Request headers
- `body`: Optional request body (for POST, PUT, DELETE requests)

**Example:**

```typescript
logger.logRequest(
  "POST",
  "https://api.example.com/articles",
  { "Content-Type": "application/json", Authorization: "Bearer token" },
  { article: { title: "Test" } }
);
```

#### logResponse(status: number, body?: any)

Logs an API response with status code and optional body.

**Parameters:**

- `status`: HTTP status code
- `body`: Optional response body

**Example:**

```typescript
logger.logResponse(201, { article: { id: 1, title: "Test" } });
logger.logResponse(204); // No body for 204 No Content
```

#### getRecentLogs()

Returns a formatted string of all recent API activity logs.

**Returns:** Formatted string containing all logged requests and responses

**Example:**

```typescript
const logs = logger.getRecentLogs();
console.log(logs);
// Output:
// ===Request Details===
// {
//     "method": "GET",
//     "url": "https://api.example.com/articles",
//     "headers": { "Authorization": "Bearer token" }
// }
//
// ===Response Details===
// {
//     "status": 200,
//     "body": { "articles": [...] }
// }
```

---

## Usage Examples

### Basic GET Request

```typescript
import { test } from "../utils/fixtures";

test("Get all articles", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 10, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(10);
});
```

### POST Request with Authentication

```typescript
test("Create article", async ({ api }) => {
  const response = await api
    .path("/articles")
    .header({
      Authorization: "Token your-auth-token",
    })
    .body({
      article: {
        title: "New Article",
        description: "Article description",
        body: "Article body",
        tagList: ["test"],
      },
    })
    .postRequest(201);

  expect(response.article.title).toEqual("New Article");
});
```

### PUT Request to Update Resource

```typescript
test("Update article", async ({ api }) => {
  const response = await api
    .path("/articles/article-slug")
    .header({
      Authorization: "Token your-auth-token",
    })
    .body({
      article: {
        title: "Updated Title",
        description: "Updated description",
      },
    })
    .putRequest(200);

  expect(response.article.title).toEqual("Updated Title");
});
```

### DELETE Request

```typescript
test("Delete article", async ({ api }) => {
  await api
    .path("/articles/article-slug")
    .header({
      Authorization: "Token your-auth-token",
    })
    .deleteRequest(204);

  // Resource is deleted
});
```

### Complex Request with Multiple Parameters

```typescript
test("Complex API request", async ({ api }) => {
  const response = await api
    .path("/search")
    .params({
      q: "playwright testing",
      limit: 20,
      filter: "recent",
      sort: "relevance",
    })
    .header({ Accept: "application/json" })
    .getRequest(200);

  expect(response.results).toBeDefined();
  expect(response.results.length).toBeLessThanOrEqual(20);
});
```

---

## Error Handling

When a status code validation fails, the RequestHandler throws an error that includes recent API activity logs for debugging:

```typescript
try {
  await api.path("/articles").getRequest(200);
} catch (error) {
  // Error message includes:
  // - Expected vs actual status code
  // - Recent API activity logs (requests and responses)
  console.error(error.message);
}
```

Example error message:

```
Expected status 200 but got 404

Recent API Activity:
===Request Details===
{
    "method": "GET",
    "url": "https://api.example.com/articles/non-existent",
    "headers": {}
}

===Response Details===
{
    "status": 404,
    "body": { "error": "Article not found" }
}
```

---

## Integration with Test Fixtures

The `RequestHandler` is typically used through the custom test fixture defined in [`utils/fixtures.ts`](../utils/fixtures.ts:1):

```typescript
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    const baseUrl: string = "https://conduit-api.bondaracademy.com/api";
    const logger = new APILogger();
    const requestHandler = new RequestHandler(request, baseUrl, logger);
    await use(requestHandler);
  },
});
```

This allows you to access the `api` fixture directly in your tests without needing to instantiate the RequestHandler manually:

```typescript
import { test } from "../utils/fixtures";

test("Example test", async ({ api }) => {
  // api is already configured with base URL and logger
  const response = await api.path("/articles").getRequest(200);
});
```
