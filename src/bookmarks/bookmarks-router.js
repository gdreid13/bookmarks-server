const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bodyParser = express.json()



const bookmarks = [{
  title: "Facebook",
  url: "https://facebook.com",
  description: "Social media site",
  rating: 3,
  id: 1,
}];

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

  })
  .delete((req, res) => {

  })

  module.exports = bookmarksRouter