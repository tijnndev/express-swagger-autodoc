import swaggerUi from 'swagger-ui-express'
import { capitalizeFirstLetter } from './utils.js'

function extractPathParams(path) {
  const pathParams = []
  const paramRegex = /:([^/]+)/g
  let match
  while ((match = paramRegex.exec(path)) !== null) {
    pathParams.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    })
  }
  return pathParams
}

function extractRoutesExpress4(app, routeMetadata) {
  const paths = {}

  function addRoute(method, path) {
    const pathParams = extractPathParams(path)
    const swaggerPath = path.replace(/:([^/]+)/g, '{$1}')
    if (!paths[swaggerPath]) paths[swaggerPath] = {}
    const key = `${method.toLowerCase()} ${swaggerPath}`

    const inputModel = routeMetadata[key] || {}
    const parameters = []

    pathParams.forEach(p => parameters.push(p))

    if (inputModel.params) {
      for (const [name, type] of Object.entries(inputModel.params)) {
        if (!parameters.find(p => p.name === name && p.in === 'path')) {
          parameters.push({
            name,
            in: 'path',
            required: true,
            schema: { type },
          })
        }
      }
    }

    if (inputModel.query) {
      for (const [name, type] of Object.entries(inputModel.query)) {
        parameters.push({
          name,
          in: 'query',
          required: false,
          schema: { type },
        })
      }
    }

    let requestBody
    if (inputModel.body) {
      requestBody = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(inputModel.body).map(([k, t]) => [k, { type: t }])
              ),
              required: Object.keys(inputModel.body),
            },
          },
        },
      }
    }

    paths[swaggerPath][method.toLowerCase()] = {
      tags: [prefix ? capitalizeFirstLetter(prefix.replace(/^\//, '')) : 'Default'],
      summary: `Auto-generated ${method.toUpperCase()} ${swaggerPath}`,
      parameters: parameters.length ? parameters : undefined,
      ...(requestBody && { requestBody }),
      responses: {
        200: { description: 'OK' },
      },
    }
  }

  function traverseStack(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const fullPath = prefix + layer.route.path
        Object.keys(layer.route.methods).forEach(method => {
          addRoute(method, fullPath)
        })
      } else if (layer.name === 'router' && layer.handle.stack) {
        let mountPath = ''
        if (layer.regexp && layer.regexp.source) {
          const match = layer.regexp.source
            .replace('^\\/', '/')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace(/\$$/, '')
            .replace("/?(?=/|$)", '')


          mountPath = match !== '/' ? match : '';
        }

        traverseStack(layer.handle.stack, prefix + mountPath)
      }
    })
  }

  traverseStack(app._router.stack)

  return paths
}


function extractRoutesExpress5(app, routeMetadata) {
  const paths = {}

  function addRoute(method, path, prefix = '') {
    const pathParams = extractPathParams(path)
    const swaggerPath = path.replace(/:([^/]+)/g, '{$1}')
    if (!paths[swaggerPath]) paths[swaggerPath] = {}
    const key = `${method.toLowerCase()} ${swaggerPath}`

    const inputModel = routeMetadata[key] || {}
    const parameters = [...pathParams]

    if (inputModel.params) {
      for (const [name, type] of Object.entries(inputModel.params)) {
        if (!parameters.find(p => p.name === name && p.in === 'path')) {
          parameters.push({
            name,
            in: 'path',
            required: true,
            schema: { type },
          })
        }
      }
    }

    if (inputModel.query) {
      for (const [name, type] of Object.entries(inputModel.query)) {
        parameters.push({
          name,
          in: 'query',
          required: false,
          schema: { type },
        })
      }
    }

    let requestBody
    if (inputModel.body) {
      requestBody = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(inputModel.body).map(([k, t]) => [k, { type: t }])
              ),
              required: Object.keys(inputModel.body),
            },
          },
        },
      }
    }

    paths[swaggerPath][method.toLowerCase()] = {
      tags: [prefix ? capitalizeFirstLetter(prefix.replace(/^\//, '')) : 'Default'],
      summary: `Auto-generated ${method.toUpperCase()} ${swaggerPath}`,
      parameters: parameters.length ? parameters : undefined,
      ...(requestBody && { requestBody }),
      responses: {
        200: { description: 'OK' },
      },
    }
  }

  function getMountPathFromRegexp(regexp) {
    const match = regexp?.source
      ?.replace(/^\\\//, '/')
      ?.replace(/\\\/\?\(\?=\\\/\|\$\)/, '')
      ?.replace(/\\\//g, '/')
      ?.replace(/\(\?:\(\.\*\)\)\?/, '')
      ?.replace(/\$$/, '')
      ?.trim()

    return match === '/' ? '' : match || ''
  }

  function traverseLayers(layers, basePath = '') {
    for (const layer of layers) {
      if (layer.route && layer.route.path) {
        const routePath = basePath + layer.route.path
        for (const method of Object.keys(layer.route.methods)) {
          addRoute(method, routePath, basePath)
        }
      } else if (layer.name === 'router' && layer.handle?.stack) {
        let mountPath = ''

        if (typeof layer.handle[PREFIX_SYMBOL] === 'string') {
          mountPath = layer.handle[PREFIX_SYMBOL]
        } else if (typeof layer.regexp?.source === 'string') {
          mountPath = getMountPathFromRegexp(layer.regexp)
        }

        const effectivePrefix = basePath + mountPath
        traverseLayers(layer.handle.stack, effectivePrefix)
      }
    }
  }


  const stack = app._router?.stack || app.router?.stack
  if (!stack) throw new Error('Cannot find router stack')

  traverseLayers(stack)

  return paths
}


function extractRoutes(app, routeMetadata) {
  if (app._router && app._router.stack) {
    return extractRoutesExpress4(app, routeMetadata)
  } else if ((app.router && app.router.stack) || (app._router && Array.isArray(app._router.stack))) {
    return extractRoutesExpress5(app, routeMetadata)
  } else {
    throw new Error('Express router not initialized. Make sure to define routes before calling setupSwagger().')
  }
}

const PREFIX_SYMBOL = Symbol('swaggerPrefix')

export function overrideAppMethods(appOrRouter, routeMetadata, prefix = '') {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
  const originalMethods = {}

  appOrRouter[PREFIX_SYMBOL] = prefix

  methods.forEach(method => {
    originalMethods[method] = appOrRouter[method].bind(appOrRouter)

    appOrRouter[method] = (path, ...handlers) => {
      let inputModel = null

      if (
        handlers.length > 0 &&
        typeof handlers[handlers.length - 1] === 'object' &&
        !Array.isArray(handlers[handlers.length - 1]) &&
        typeof handlers[handlers.length - 1] !== 'function'
      ) {
        inputModel = handlers.pop()
      }

      const fullPath = `${prefix}${path}`.replace(/\/+/g, '/')
      const swaggerPath = fullPath.replace(/:([^/]+)/g, '{$1}')
      routeMetadata[`${method.toLowerCase()} ${swaggerPath}`] = inputModel || {}

      return originalMethods[method](path, ...handlers)
    }
  })
}

export function registerSwagger(app, routeMetadata, options = {}) {
  const {
    route = '/docs',
    title = 'API Documentation',
    version = '1.0.0',
    description = 'Auto-generated Swagger UI',
  } = options

  const paths = extractRoutes(app, routeMetadata)

  const openapiSpec = {
    openapi: '3.0.0',
    info: { title, version, description },
    paths,
  }

  app.use(route, swaggerUi.serve, swaggerUi.setup(openapiSpec))
}
