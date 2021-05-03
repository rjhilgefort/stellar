const { log } = console

const express = require('express')
const short = require('short-uuid')
const { getUnixTime, isAfter } = require('date-fns')

const { db } = require('./db')
const { slugify, isSnippetNameUnique } = require('./lib')

const HOST = 'localhost'
const PORT = 3000

const app = express()
app.use(express.json())

/**
 * @description
 *   These are Hindly-Milner style type declarations
 *
 * UnixTimestamp :: number
 * Seconds :: number
 * ShortUUID :: string
 * URL :: string
 *
 * Snippet :: {
 *   key: ShortUUID
 *   name: string
 *   slug: string
 *   snippet: string
 *   url: URL
 *   // Issued At Time
 *   iat: UnixTimestamp
 *   // Expires At Time
 *   eat: UnixTimestamp
 * }
 *
 * DB :: LevelDB
 */

// server ///////////////////////////////////////////////////////////////

// SnippetsCreate_Body :: {
//   name: string
//   snippet: string
//   expires_in: Seconds
// }
app.post(
  '/snippets/create',
  async ({ body: { name, snippet, expires_in } }, res) => {
    if (!isSnippetNameUnique(db)(name)) {
      return res.status(422).send(`"name" must be unique! Received: ${name}`)
    }

    const iat = getUnixTime(Date.now())
    const key = short.generate()
    const slug = slugify(name)
    const url = `http://${HOST}:${PORT}/snippets/name/${slug}`

    db.get('snippets')
      .push({
        key,
        name,
        slug,
        snippet,
        url,
        iat,
        eat: iat + expires_in,
      })
      .write()

    return res.send(url)
  }
)

app.get('/snippets/id/:key', ({ params: { key } }, res) => {
  res.send(db.get('snippets').find({ key }).value())
})

app.get('/snippets/name/:slug', ({ params: { slug } }, res) => {
  res.set('Content-Type', 'text/html')

  const snippet = db.get('snippets').find({ slug }).value()

  console.log({
    eat: snippet.eat,
    now: getUnixTime(Date.now()),
  })
  if (isAfter(getUnixTime(Date.now()), snippet.eat)) {
    // if (snippet.eat > getUnixTime(Date.now())) {
    return res
      .status(410)
      .send('Your snippet has expired, please create another!')
  }

  db.get('snippets')
    .find({ key: snippet.key })
    .assign({ eat: snippet.eat + 30 })
    .write()

  res.send(snippet.snippet)
})

log('\n\n\n===========================')
log('Server booting...')
app.listen(PORT, () => {
  log(`Listening at http://${HOST}:${PORT}`)
})
