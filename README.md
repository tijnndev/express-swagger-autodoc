# express-swagger-autodoc

Auto-generate OpenAPI (Swagger) documentation for your Express.js routes — supports Express 4 and 5.
Integrates with [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express) to provide interactive API docs.

---

## Features

* Automatically extracts routes from Express app (supports nested routers)
* Supports path params, query params, and JSON request bodies via simple metadata
* Easy metadata declaration inline with route handlers
* Generates OpenAPI 3.0 spec dynamically
* Serves Swagger UI at configurable route (default `/docs`)

---

## Installation

```bash
npm install express express-swagger-autodoc swagger-ui-express
```

---

## Usage

```js
import express from 'express'
import { overrideAppMethods, registerSwagger } from 'express-swagger-autodoc'

const app = express()
app.use(express.json())

const routeMetadata = {}

// Override app HTTP methods to capture route metadata
overrideAppMethods(app, routeMetadata)

// Define routes as usual, but to specify request body or query parameters,
// you **must add the metadata object as the last argument** after the handler function.
// The `params` field for path parameters is optional since path params are inferred automatically.
app.get('/hello', (req, res) => {
  res.send('Hello')
})

app.get('/search', (req, res) => {
  res.send(`Search term is: ${req.query.term}`)
}, { query: { term: 'string' } })

app.get('/user/:id', (req, res) => {
  res.send(`User ID: ${req.params.id}`)
})

app.post('/user', (req, res) => {
  res.send(`Created user: ${req.body.name}`)
}, { body: { name: 'string' } })

// Register Swagger UI middleware with routeMetadata
registerSwagger(app, routeMetadata, {
  route: '/docs',
  title: 'My API',
  version: '1.0.0',
  description: 'Auto-generated Swagger docs',
})

app.listen(3000, () => console.log('Listening on port 3000'))
```

---

## API

### `overrideAppMethods(app, routeMetadata)`

Wraps Express app HTTP methods (`get`, `post`, `put`, `delete`, etc.) to extract route input metadata.
- Routes must specify request body (body) and query parameters (query) metadata as the last argument, after the handler function.
- Path parameters (params) are optional since they are automatically detected from the route path (/user/:id).

```js
app.post('/user', handler, {
  body: { name: 'string', age: 'integer' },
  query: { active: 'boolean' }
})
```

### `registerSwagger(app, routeMetadata, options)`

Sets up Swagger UI route to serve the generated OpenAPI spec.

* `app`: Express app instance
* `routeMetadata`: Metadata collected via `overrideAppMethods`
* `options` (optional):

  * `route` (string): Path to serve Swagger UI (default: `/docs`)
  * `title` (string): API title (default: `'API Documentation'`)
  * `version` (string): API version (default: `'1.0.0'`)
  * `description` (string): API description (default: `'Auto-generated Swagger UI'`)

---

## How it works

* Parses Express router stack to find all routes
* Converts Express path params (`:id`) to OpenAPI style (`{id}`)
* Uses provided metadata to generate parameter schemas for path, query, and JSON body
* Generates minimal OpenAPI 3.0 spec with operation summary, parameters, requestBody, and 200 response

---

## Author
[TijnnDev](https://github.com/tijnndev)