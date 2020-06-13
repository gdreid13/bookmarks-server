require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const BookmarksService = require('../bookmarks-service')
const { v4: uuid } = require('uuid');
const bookmarksRouter = require('./bookmarks/bookmarks-router')
const logger = require('./logger')
const app = express()
const knex = require('knex')

const knexInstance = knex({
  client: 'pg',
  connection: process.env.DB_URL,
})

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


app.get('/bookmarks', (req, res, next) => {
  BookmarksService.getAllArticles(knexInstance)
  .then(bookmarks => console.log(bookmarks))
  .then(() => 
    BookmarksService.insertBookmark(knexInstance, {
      title: 'New title',
      url: 'www.google.com',
      rating: 3,
    })
  )
  .then(newBookmark => {
    console.log(newBookmark)
    return BookmarksService.updateBookmark(
      knexInstance,
      newBookmark.id,
      { title: 'Updated title'}
    ).then(() => BookmarksService.getById(knexInstance, newBookmark.id))
  })
  .then(bookmark => {
    console.log(bookmark)
    return BookmarksService.deleteBookmark(knexInstance, id)
  })
})




app.use(bookmarksRouter)

app.get('/', (req, res) => {
  res.send('Hello, seeker!')
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