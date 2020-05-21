const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const store = require('../store')

const bookmarksRouter = express.Router()
const bodyParser = express.json()


bookmarksRouter
  .route('/bookmarks')
  .get((req,res) => {
    res
    .json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    console.log(title, url, description, rating);
  
    if (!title) {
      logger.error('Title is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!url) {
      logger.error('URL is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!description) {
      logger.error('description is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!rating) {
      logger.error('rating is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    }
    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    }

    const id = uuid();
  
    const bookmark = {
      title, 
      url,
      description,
      rating,
      id
    };
  
    store.bookmarks.push(bookmark);
  
    logger.info(`Bookmark with id ${id} created`);
  
    res
      .status(201)
      .location(`http://localhost:8000/card/${id}`)
      .json(bookmark);
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { bookmark_id } = req.params;
    const bookmark = bookmarks.find(b => b.id == bookmark_id);
  
    if (!bookmark) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`);
      return res
        .status(404)
        .send('Bookmark not found');
    }
  
    res.json(bookmark);
  })
  .delete((req, res) => {
    const { bookmark_id } = req.params;
    const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id)

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`)
      return res
        .status(404)
        .send('Bookmark Not Found')
    }

    store.bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${bookmark_id} deleted`);
    res
      .status(204)
      .end();
  })

  module.exports = bookmarksRouter