import express from 'express'
import { overrideAppMethods, registerSwagger } from 'express-swagger-autodoc'

const app = express()
app.use(express.json())

const routeMetadata = {}

overrideAppMethods(app, routeMetadata)

app.get('/hello', (req, res) => {
  res.send('Hello')
})

app.get('/search', (req, res) => {
  res.send(`Search term is: ${req.query.term}`)
}, { query: { term: 'string' } })

app.get('/user/:dwadawdawd', (req, res) => {
  res.send(`User ID: ${req.params.dwadawdawd}`)
})

app.post('/user', (req, res) => {
  res.send(`Created user: ${req.body.name}`)
}, { body: { name: 'string' } })

registerSwagger(app, routeMetadata)

app.listen(3000, () => console.log('Listening on :3000'))
