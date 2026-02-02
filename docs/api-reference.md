# API Reference: RequestHandler Class

The `RequestHandler` class is a utility wrapper around Playwright's `APIRequestContext` that provides a fluent interface for building and executing HTTP requests.

## Constructor

```typescript
constructor(request: APIRequestContext, apiBaseUrl: string)
```

Creates a new instance of the RequestHandler.

**Parameters:**

- `request`: Playwright's APIRequestContext instance
- `apiBaseUrl`: Base URL for all API requests

## Methods

### url(url: string)

Sets the base URL for the current request. If not set, uses the default base URL from the constructor.

**Parameters:**

- `url`: The URL to use for the request

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
const handler = new RequestHandler(request, "https://api.example.com");
handler.url("https://custom-api.example.com");
```

### path(path: string)

Sets the API path to append to the base URL.

**Parameters:**

- `path`: The API path (e.g., "/users", "/articles/123")

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api.path("/articles").getRequest(200);
```

### params(params: object)

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

### header(headers: Record<string, string>)

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

### body(body: object)

Sets the request body for POST, PUT, and PATCH requests.

**Parameters:**

- `body`: Object to be serialized as JSON in the request body

**Returns:** `RequestHandler` instance for method chaining

**Example:**

```typescript
api
  .path("/articles")
  .body({
    title: "New Article",
    content: "Article content",
    tags: ["test", "example"],
  })
  .postRequest(201); // Note: postRequest needs to be implemented
```

### getRequest(statusCode: number)

Executes a GET request and validates the response status code.

**Parameters:**

- `statusCode`: Expected HTTP status code (for validation)

**Returns:** Promise resolving to the JSON response body

**Example:**

```typescript
const response = await api
  .path("/articles")
  .params({ limit: 5 })
  .getRequest(200);

console.log(response.articles); // Access response data
```

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

### GET Request with Headers

```typescript
test("Get protected resource", async ({ api }) => {
  const response = await api
    .path("/user/profile")
    .header({ Authorization: "Bearer your-token-here" })
    .getRequest(200);

  expect(response.user.email).toBeDefined();
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

## Current Limitations

The current implementation of `RequestHandler` only includes the `getRequest` method. To fully utilize the fluent interface, you may want to extend it with additional HTTP methods:

```typescript
// Example of what could be added:
async postRequest(expectedStatusCode: number) {
  const url = this.getUrl();
  const response = await this.request.post(url, {
    headers: this.apiHeaders,
    data: this.apiBody,
  });
  expect(response.status()).toEqual(expectedStatusCode);
  return await response.json();
}

async putRequest(expectedStatusCode: number) {
  const url = this.getUrl();
  const response = await this.request.put(url, {
    headers: this.apiHeaders,
    data: this.apiBody,
  });
  expect(response.status()).toEqual(expectedStatusCode);
  return await response.json();
}

async deleteRequest(expectedStatusCode: number) {
  const url = this.getUrl();
  const response = await this.request.delete(url, {
    headers: this.apiHeaders,
  });
  expect(response.status()).toEqual(expectedStatusCode);
  // DELETE requests might not return JSON
  return response.status() === 204 ? null : await response.json();
}
```

## Integration with Test Fixtures

The `RequestHandler` is typically used through the custom test fixture defined in `utils/fixtures.ts`:

```typescript
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    const baseUrl: string = "https://conduit-api.bondaracademy.com/api";
    const requestHandler = new RequestHandler(request, baseUrl);
    await use(requestHandler);
  },
});
```

This allows you to access the `api` fixture directly in your tests without needing to instantiate the RequestHandler manually.
