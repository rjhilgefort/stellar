const { replace } = require('ramda')
const { kebabCase } = require('lodash/fp')
const { pipe } = require('fp-ts/lib/function')
const { isUndefined } = require('ramda-adjunct')

// slugify :: Snippet['name'] => string
const slugify = (name) => pipe(name, replace(/&/g, '-and-'), kebabCase)

// isSnippetNameUnique :: DB => string => Promise<boolean>
const isSnippetNameUnique = (db) => (name) =>
  pipe(db.get('snippets').find({ name }).value(), isUndefined)

module.exports = {
  slugify,
  isSnippetNameUnique,
}
