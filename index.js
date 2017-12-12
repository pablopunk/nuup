#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const actions = require('./lib/actions')
const { error, happy } = require('./lib/log')

// get args from cli
const args = process.argv.slice(2)

// parse input
const flags = mri(args)
const argc = flags._.length

if (argc > actions.max) {
  error(`Number of actions (${argc}) is more than allowed: ${actions.max}`)
  process.exit(1)
}

if (argc === 0) {
  actions
    .runDefault(process.env.PWD)
    .then(() => {
      happy('Version completed. Yay!')
      process.exit(0)
    })
    .catch(err => error(err))
}

// shouldn't run if git is not clean
if (!isGitClean.sync()) {
  error('Please commit all files before publishing')
  process.exit(1)
}

// run all actions
flags._.map(a => {
  actions
    .run(a, process.env.PWD)
    .then(() => happy(`${a} version published. Yay!`))
    .catch(err => error(err))
})
