#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const { shell } = require('execa')
const ora = require('ora')
const actions = require('./lib/actions')

const behindRemoteRegex = [
  /Your branch is behind/,
  /Your branch .* have diverged/
]

let spinner

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

  spinner = ora({ text: 'Started nuup!', stream: process.stdout })
  if (argc > actions.max) {
    throw new Error(`Number of actions (${argc}) is more than allowed: ${actions.max}`)
  }

  spinner = ora({ text: 'Checking if git is clean', stream: process.stdout }).start()
  return checkGitClean(dirname)
    .then(() => {
      spinner.succeed('Git is clean')
      spinner = ora({ text: 'Checking if remote is clean', stream: process.stdout }).start()
    })
    .then(checkRemoteAhead)
    .then(() => {
      spinner.succeed('Remote is clean')
    })
    .then(() => performActions(commands, dirname, argc === 0))
    .catch(err => spinner.fail(err.message))
}

cli(process.argv.slice(2))
  .catch(err => spinner.fail(err))
