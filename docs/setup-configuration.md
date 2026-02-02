# Setup and Configuration Guide

This guide covers setting up the Playwright API testing framework and configuring it for your needs.

## Prerequisites

Before setting up the framework, ensure you have the following installed:

- Node.js (version 14 or higher)
- npm (usually comes with Node.js)
- Git (for cloning the repository)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ezra31448/playwright-api.git
cd playwright-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

- `@playwright/test`: The Playwright testing framework
- `@types/node`: TypeScript type definitions for Node.js

### 3. Install Playwright Browsers

Even though this is an API testing framework (not browser testing), Playwright still requires browser binaries to be installed for test execution:

```bash
npx playwright install
```

## Configuration

### Playwright Configuration

The framework is configured through `playwright.config.ts`. Here's an overview of the key settings:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api-testing",
    },
  ],
});
```

#### Key Configuration Options

- `testDir`: Directory containing test files (default: `./tests`)
- `fullyParallel`: Run tests in parallel across files
- `forbidOnly`: Fail if tests are marked with `.only` in CI
- `retries`: Number of retries for failed tests (2 in CI, 0 locally)
- `workers`: Number of parallel workers (1 in CI, auto locally)
- `reporter`: Test reporters (HTML and list)
- `trace`: When to collect traces (on first retry)
- `projects`: Test projects (configured for API testing)

### Customizing the Configuration

#### Adding Environment-Specific Settings

You can modify the configuration for different environments:

```typescript
import { defineConfig } from "@playwright/test";

const isCI = process.env.CI === "true";
const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  // ... other config

  use: {
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    // Add other environment-specific settings
  },

  projects: [
    {
      name: "api-testing",
      // Environment-specific project settings
      testMatch: isDev ? "**/*.spec.ts" : "**/*.prod.spec.ts",
    },
  ],
});
```

#### Adding Custom Reporters

You can add additional reporters for different output formats:

```typescript
export default defineConfig({
  // ... other config

  reporter: [
    ["html", { outputFolder: "test-results/html" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["list"],
  ],
});
```

### Environment Variables

Create a `.env` file in the root directory for environment-specific configuration:

```bash
# .env file
API_BASE_URL=https://api.example.com
API_USERNAME=testuser
API_PASSWORD=testpass
CI=false
```

Note: To use environment variables in your configuration, you'll need to install and configure the `dotenv` package:

```bash
npm install dotenv
```

Then update `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  // ... other config

  use: {
    // Use environment variable for base URL
    baseURL: process.env.API_BASE_URL,
  },
});
```

### RequestHandler Configuration

The `RequestHandler` is configured in `utils/fixtures.ts`. You can customize it for your needs:

#### Changing the Base URL

```typescript
// utils/fixtures.ts
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    // Use environment variable or default
    const baseUrl: string =
      process.env.API_BASE_URL || "https://conduit-api.bondaracademy.com/api";
    const requestHandler = new RequestHandler(request, baseUrl);
    await use(requestHandler);
  },
});
```

#### Adding Authentication to the Fixture

```typescript
// utils/fixtures.ts
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    const baseUrl: string =
      process.env.API_BASE_URL || "https://api.example.com";
    const requestHandler = new RequestHandler(request, baseUrl);
    await use(requestHandler);
  },

  authenticatedApi: async ({ request }, use) => {
    const baseUrl: string =
      process.env.API_BASE_URL || "https://api.example.com";
    const requestHandler = new RequestHandler(request, baseUrl);

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

## Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/example.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should create"

# Run tests with specific project
npx playwright test --project=api-testing
```

### Running Tests in Different Modes

```bash
# Run tests in debug mode
npx playwright test --debug

# Run tests with UI (Playwright Inspector)
npx playwright test --ui

# Run tests with trace viewer
npx playwright test --trace on

# Run tests and generate HTML report
npx playwright test --reporter=html
```

### Viewing Test Results

```bash
# Open HTML report
npx playwright show-report

# View trace files
npx playwright show-trace trace.zip
```

## IDE Configuration

### VS Code Setup

For the best development experience in VS Code:

1. Install the Playwright extension:
   - Open Extensions panel (Ctrl+Shift+X)
   - Search for "Playwright Test for VSCode"
   - Install the extension

2. Configure TypeScript:
   - Create a `tsconfig.json` file if it doesn't exist:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"]
}
```

3. Add VS Code settings (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Debugging Configuration

Create a `.vscode/launch.json` file for debugging tests:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Playwright Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/lib/cli.js",
      "args": ["test", "${input:testFile}", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ],
  "inputs": [
    {
      "id": "testFile",
      "description": "Test file path",
      "default": "tests/example.spec.ts",
      "type": "promptString"
    }
  ]
}
```

## CI/CD Configuration

### GitHub Actions

Create a `.github/workflows/playwright.yml` file:

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Jenkins

Create a Jenkinsfile:

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Test') {
            steps {
                sh 'npx playwright test'
            }
        }
    }

    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Playwright browsers not installed**:

   ```bash
   npx playwright install
   ```

2. **Permission denied errors**:

   ```bash
   chmod +x node_modules/.bin/playwright
   ```

3. **TypeScript compilation errors**:
   - Ensure `tsconfig.json` is properly configured
   - Check that all dependencies are installed

4. **Test timeouts**:
   - Increase timeout in `playwright.config.ts`:
   ```typescript
   export default defineConfig({
     timeout: 30000, // 30 seconds
     expect: {
       timeout: 10000, // 10 seconds for assertions
     },
     // ... other config
   });
   ```

### Debugging Tips

1. Use the Playwright Inspector:

   ```bash
   npx playwright test --debug
   ```

2. Generate traces for failed tests:

   ```bash
   npx playwright test --trace on
   ```

3. Run tests with verbose output:

   ```bash
   npx playwright test --reporter=list
   ```

4. Run a single test to isolate issues:
   ```bash
   npx playwright test --grep "specific test name"
   ```
