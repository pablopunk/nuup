#!/usr/bin/env node

const { error } = require('./lib/log')

require('./index.js')(process.argv.slice(2))
  .catch(error)
