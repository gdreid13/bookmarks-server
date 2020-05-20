const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')

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
  
    const id = uuid();
  
    const bookmark = {
      title, 
      url,
      description,
      rating,
      id
    };
  
    bookmarks.push(bookmark);
  
    logger.info(`Bookmark with id ${id} created`);
  
    res
      .status(201)
      .location(`http://localhost:8000/card/${id}`)
      .json(bookmark);
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
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
  .delete((req, res) => {
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

  module.exports = bookmarksRouter