#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const {shell} = require('execa')
const pkg = require('./package.json')
const spinner = require('./lib/spinner')
const actions = require('./lib/actions')

const behindRemoteRegex = [
  /Your branch is behind/,
  /Your branch .* have diverged/
]

async function checkRemoteAhead(dirname) {
  const {stdout} = await shell('git fetch && git status', {cwd: dirname})
  const dirty = behindRemoteRegex.map(reg => reg.test(stdout))

  if (dirty.includes(true)) {
    throw new Error('Remote contains changes you don\'t have yet, please `git pull` before using nuup')
  }
}

async function checkGitClean(dirname) {
  const isClean = await isGitClean(dirname)
  if (!isClean) {
    throw new Error('Please commit all files before publishing')
  }
}

async function performActions(commands, options) {
  options = Object.assign({
    dirname: process.env.PWD,
    isDefault: false,
    noNpm: false
  }, options)

  if (options.isDefault) {
    return actions.runDefault({dirname: options.dirname, noNpm: options.noNpm})
  }

  const promises = []
  for (const a of commands) {
    promises.push(actions.run(a, {dirname: options.dirname, noNpm: options.noNpm}))
  }

  return Promise.all(promises)
}

function parseFlags(args) {
  const version = (args.version || args.v)
  const noNpm = (args['no-npm'] || args.n)

  return {version, noNpm}
}

async function cli(argv) {
  const dirname = process.env.PWD
  const args = mri(argv)
  const commands = args._

  if (commands.length > actions.max) {
    throw new Error(`Number of actions (${commands.length}) is more than allowed: ${actions.max}`)
  }

  const flags = parseFlags(args)

  if (flags.version) {
    console.log(`Version ${pkg.version}`)
    return
  }

  spinner.start('Checking if git is clean')
  return checkGitClean(dirname)
    .then(checkRemoteAhead)
    .then(() => spinner.stop('Git is clean'))
    .then(() => performActions(commands, {isDefault: commands.length === 0, noNpm: flags.noNpm}))
    .catch(err => spinner.fail(err.message))
}

cli(process.argv.slice(2))
  .catch(err => spinner.fail(err.message))
