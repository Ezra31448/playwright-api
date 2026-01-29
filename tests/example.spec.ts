import { test, expect, request } from '@playwright/test';

let authToken: string

test.beforeAll('run before all', async ({ request }) => {
  const tokenResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {
        "email": "ezra_api_test@gmail.com",
        "password": "q1w2e3r4"
      }
    }
  })
  const tokenResponseJSON = await tokenResponse.json()
  authToken = 'Token ' + tokenResponseJSON.user.token
})
test.afterAll('run before all', async ({ }) => {

})
test.beforeEach('run before all', async ({ }) => {

})

test.afterEach('run before all', async ({ }) => {

})

test('Get Test Tags', async ({ request }) => {
  const tagsResponse = await request.get('https://conduit-api.bondaracademy.com/api/tags')
  const tagsResponseJSON = await tagsResponse.json()

  expect(tagsResponse.status()).toEqual(200)
  expect(tagsResponseJSON.tags[0]).toEqual('Test')
  expect(tagsResponseJSON.tags.length).toBeLessThanOrEqual(10)
});

test('Get All Article', async ({ request }) => {
  const articleResponse = await request.get('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0')
  const articleResponseJSON = await articleResponse.json()

  expect(articleResponse.status()).toEqual(200)
  expect(articleResponseJSON.articles.length).toBeLessThanOrEqual(10)
  expect(articleResponseJSON.articlesCount).toEqual(10)
})

// Create Article
test('Create Article', async ({ request }) => {
  const newArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article": {
        "title": "Test Create Article",
        "description": "test create article via playwright api",
        "body": "*Test*",
        "tagList": [
          "Kanoon"
        ]
      }
    },
    headers: {
      Authorization: authToken
    }
  })
  const newArticleResponseJSON = await newArticleResponse.json()
  expect(newArticleResponse.status()).toEqual(201)
  expect(newArticleResponseJSON.article.title).toEqual('Test Create Article')
  const slugId = await newArticleResponseJSON.article.slug

  const articleResponse = await request.get('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
    {
      headers: {
        Authorization: authToken
      }
    }
  )
  const articleResponseJSON = await articleResponse.json()
  expect(articleResponseJSON.articles).toContainEqual(expect.objectContaining({
    title: "Test Create Article", description: "test create article via playwright api"
  }))

  const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
    headers: {
      Authorization: authToken
    }
  })
  expect(deleteResponse.status()).toEqual(204)

});

test('Create, Update and Delete Article', async ({ request }) => {
  const newArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article": {
        "title": "Test Create Article For Update",
        "description": "test create article via playwright api",
        "body": "*Test*",
        "tagList": [
          "Kanoon"
        ]
      }
    },
    headers: {
      Authorization: authToken
    }
  })
  const newArticleResponseJSON = await newArticleResponse.json()
  expect(newArticleResponse.status()).toEqual(201)
  expect(newArticleResponseJSON.article.title).toEqual('Test Create Article For Update')
  const slugId = await newArticleResponseJSON.article.slug

  const updateArticleResponse = await request.put(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
    headers: {
      Authorization: authToken
    },
    data: {
      "article": {
        "title": "Test Create Article Modified",
        "description": "edit data via playwright api",
        "body": "edit data via playwright api but this is a body",
        "tagList": [
          "Kanoon"
        ],
        "slug": `${slugId}`
      }
    }
  })
  const updateArticleResponseJSON = await updateArticleResponse.json()
  expect(updateArticleResponse.status()).toEqual(200)
  const newSlugId = updateArticleResponseJSON.article.slug
  expect(updateArticleResponseJSON.article.title).toEqual('Test Create Article Modified')

  const articleResponse = await request.get('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
    {
      headers: {
        Authorization: authToken
      }
    }
  )
  const articleResponseJSON = await articleResponse.json()
  expect(articleResponse.status()).toEqual(200)
  expect(articleResponseJSON.articles).toContainEqual(expect.objectContaining({
    title: "Test Create Article Modified", description: "edit data via playwright api"
  }))

  const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${newSlugId}`, {
    headers: {
      Authorization: authToken
    }
  })
  expect(deleteResponse.status()).toEqual(204)

});
