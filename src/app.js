require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const { v4: uuid } = require('uuid');
const bookmarksRouter = require('./bookmarks/bookmarks-router')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  next()
})

app.use(bookmarksRouter)

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.get('/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  const bookmark = bookmarks.find(b => b.id == id);

  if (!bookmark) {
    logger.error(`Bookmark with id ${id} not found.`);
    return res
      .status(404)
      .send('Bookmark not found');
  }

  res.json(bookmark);
})

app.delete('/bookmark/:id', (req, res) => {
  const { id } = req.params;

  for (i = 0; i < bookmarks.length; i++) {
   if (id === bookmarks[i].id) {
    bookmarks.splice(id, 1);
    logger.info(`Bookmark with id ${id} deleted`);
    return res
      .status(204)
      .end();
    }
  }
  logger.error(`Bookmark with id ${id} not found`);
  res
    .status(404)
    .send(`Bookmark not found`);
})

app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app