#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const actions = require('./lib/actions')
const { error, happy } = require('./lib/log')

// get args from cli
const args = process.argv.slice(2)

// parse input
const commands = mri(args)._
const argc = commands.length

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
  process.exit(0)
}

// run all actions
commands.map(a => {
  actions
    .run(a, process.env.PWD)
    .then(() => happy(`${a} version published. Yay!`))
    .catch(err => error(err))
})
