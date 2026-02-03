import { test } from "../utils/fixtures";
import { expect } from "@playwright/test";
import { APILogger } from "../utils/logger";

let authToken: string;

test.beforeAll("run before all", async ({ api }) => {
  const tokenResponse = await api
    .path("/users/login")
    .body({
      user: {
        email: "ezra_api_test@gmail.com",
        password: "q1w2e3r4",
      },
    })
    .postRequest(200);
  authToken = "Token " + tokenResponse.user.token;
});

test("logger", () => {
  const logger = new APILogger();
  logger.logRequest(
    "GET",
    "https://test.com/api",
    { Authorization: "token" },
    { foo: "bar" },
  );
  logger.logResponse(200, { foo: "bar" });
  const logs = logger.getRecentLogs();
  console.log(logs);
});

test("Get Articles", async ({ api }) => {
  const response = await api
    .path("/articles")
    .params({ limit: 10, offset: 0 })
    .getRequest(200);

  expect(response.articles.length).toBeLessThanOrEqual(10);
  expect(response.articlesCount).toEqual(10);
});

test("Get Test Tags", async ({ api }) => {
  const response = await api.path("/tags").getRequest(200);

  expect(response.tags[0]).toEqual("Test");
  expect(response.tags.length).toBeLessThanOrEqual(10);
});

test("Create, Update, Get, and Delete Article", async ({ api }) => {
  const createArticleResponse = await api
    .path("/articles")
    .header({
      Authorization: authToken,
    })
    .body({
      article: {
        title: "Test Create Article For Update",
        description: "test create article via playwright api",
        body: "*Test*",
        tagList: ["Kanoon"],
      },
    })
    .postRequest(201);
  expect(createArticleResponse.article.title).toEqual(
    "Test Create Article For Update",
  );

  const slugId = await createArticleResponse.article.slug;

  const updateArticleResponse = await api
    .path(`/articles/${slugId}`)
    .header({
      Authorization: authToken,
    })
    .body({
      article: {
        title: "Test Create Article Modified",
        description: "edit data via playwright api",
        body: "edit data via playwright api but this is a body",
        tagList: ["Kanoon"],
        slug: `${slugId}`,
      },
    })
    .putRequest(200);

  const newSlugId = updateArticleResponse.article.slug;
  expect(updateArticleResponse.article.title).toEqual(
    "Test Create Article Modified",
  );

  const articleResponse = await api
    .path("/articles")
    .params({ limit: 10, offset: 0 })
    .header({
      Authorization: authToken,
    })
    .getRequest(200);
  expect(articleResponse.articles).toContainEqual(
    expect.objectContaining({
      title: "Test Create Article Modified",
      description: "edit data via playwright api",
    }),
  );

  const deleteResponse = await api
    .path(`/articles/${newSlugId}`)
    .header({
      Authorization: authToken,
    })
    .deleteRequest(204);
});
