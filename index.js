#!/usr/bin/env node

'use strict'

const mri = require('mri')
const chalk = require('chalk')
const actions = require('./lib/actions')
const git = require('./lib/git')

// get args from cli
const args = process.argv.slice(2)

// parse input
const flags = mri(args)

if (flags._.length > actions.max) {
  throw Error(`Number of actions (${flags._.length}) is more than allowed: ${actions.max}`)
}

// shouldn't run if git is not clean
if (!git.isClean()) {
  console.log(chalk.red('Please commit all files before publishing'))
  process.exit(1)
}

flags._.map(a => actions.do(a, process.env.PWD))
