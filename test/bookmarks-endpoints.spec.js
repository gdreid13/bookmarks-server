const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe('GET /api/bookmarks', () => {

    context('Given no bookmarks', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, [])
      })

    })

    context('Given there are articles in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks)
      })
    })
    
  })

  describe(`GET /bookmarks/:bookmark_id`, () => {

    context(`Given no bookmarks`, () => {
      it (`responds with a 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context(`Given that there are bookmarks in the database`, () => {

      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })


      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark)
      })

    })


  })

  describe(`POST /api/bookmarks`, () => {

    context(`Given an XSS attack bookmark`, () => {
      const maliciousBookmark = {
        id: 911,
        title: `Naughty naughty very naughty <script>alert("xss");</script>`,
        url: 'malicio.us',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 3
      }

      beforeEach(`insert malicious bookmark`, () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })

      it(`removes XSS attack content`, () => {
        return supertest(app)
        .get(`/api/bookmarks/${maliciousBookmark.id}`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(200)
        .expect(res => {
          expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
          expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
        })
      })

    })

    it('creates a bookmark, responds with 201 and new bookmark', () => {
      this.retries(3)
      const newBookmark = {
        title: 'Test new title',
        url: 'https://test.url',
        description: 'Test description',
        rating: 3,
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes => {
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        })
    })

    context(`Given improperly submitted bookmarks`, () => {

      it('rejects a posted bookmark if the rating is not between 1 and 5', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({
            title: 'Some title',
            url: 'https://rat.ing',
            rating: 6,
          })
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(400, { error: { message: `'rating' must be a number between 0 and 5` } })
      })

      it('rejects a posted bookmark if the url is invalid', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({
            title: 'Some title',
            url: 'this is not a url',
            rating: 3,
          })
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(400, { error: { message: `'url' must be a valid URL` } })
      })

      context('rejects a posted bookmark without all required fields', () => {
        it('title field missing', () => {
          return supertest(app)
            .post('/api/bookmarks')
            .send({
              url: 'https://rat.ing',
              rating: 3,
            })
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(400, { error: { message: `'title' is required` } })
        })
        it('url field missing', () => {
          return supertest(app)
            .post('/api/bookmarks')
            .send({
              title: 'Some title',
              rating: 3,
            })
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(400, { error: { message: `'url' is required`} })
        })
        it('rating field missing', () => {
          return supertest(app)
            .post('/api/bookmarks')
            .send({
              title: 'Some title',
              url: 'https://rat.ing',
            })
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(400, { error: { message: `'rating' is required`} })
        })
      })
    })
    
  })

  describe('DELETE /api/bookmarks', () => {

    context(`Given no bookmarks`, () => {
      it (`responds with a 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context(`Given there are bookmarks in the database`, () => {

      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it(`deletes the bookmark and responds with a 204`, () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmarks)
          )
      })
    })

  })

  describe('PATCH /api/bookmarks', () => {

    context(`Given no bookmarks`, () => {
      it (`responds with a 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context(`Given there are bookmarks in the database`, () => {

      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2
        const updateBookmark= {
          title: 'Updated title',
          url: 'https://upda.te',
          description: 'Updated description',
          rating: 2,
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(updateBookmark)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark)
            )
      })

      it(`responds with a 400 when no fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send({ irrelevantField: 'foo'})
          .expect(400, {
            error: { message: `Request body must contain either 'title', 'url', 'description', or 'rating'` }
          })
      })

      it('responds with 204 and updates with only a subset of fields', () => {
        const idToUpdate = 2
        const updateBookmark= {
          title: 'Updated title',
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark)
            )
      })

    })


  })
})