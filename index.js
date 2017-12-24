#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const { shell } = require('execa')
const spinner = require('./lib/spinner')
const actions = require('./lib/actions')

const behindRemoteRegex = [
  /Your branch is behind/,
  /Your branch .* have diverged/
]

async function checkRemoteAhead (dirname) {
  const { stdout } = await shell('git fetch && git status', { cwd: dirname })
  const dirty = behindRemoteRegex.map(reg => reg.test(stdout))

  if (dirty.includes(true)) {
    throw new Error('Remote contains changes you don\'t have yet, please `git pull` before using nuup')
  }
}

async function checkGitClean (dirname) {
  const isClean = await isGitClean(dirname)
  if (!isClean) {
    throw new Error('Please commit all files before publishing')
  }
}

async function performActions (commands, dirname, isDefault) {
  if (isDefault) {
    return actions.runDefault(dirname)
  }
  for (let a of commands) {
    await actions.run(a, process.env.PWD)
  }
}

async function cli (args) {
  const dirname = process.env.PWD
  const commands = mri(args)._
  const argc = commands.length

  if (argc > actions.max) {
    throw new Error(`Number of actions (${argc}) is more than allowed: ${actions.max}`)
  }

  spinner.start('Checking if git is clean')
  return checkGitClean(dirname)
    .then(() => {
      spinner.stop('Git is clean')
      spinner.start('Checking if remote is clean')
    })
    .then(checkRemoteAhead)
    .then(() => spinner.stop('Remote is clean'))
    .then(() => performActions(commands, dirname, argc === 0))
    .catch(err => spinner.fail(err.message))
}

cli(process.argv.slice(2))
  .catch(err => spinner.fail(err.message))
