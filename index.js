#!/usr/bin/env node

'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const { shell } = require('execa')
const actions = require('./lib/actions')
const { error, happy } = require('./lib/log')

const behindRemoteRegex = [
  /Your branch is behind/,
  /Your branch .* have diverged/
]

async function isRemoteAhead (dirname) {
  const { stdout } = shell('git fetch && git status', { cwd: dirname })
  const dirty = behindRemoteRegex.map(reg => reg.test(stdout))
  return dirty.includes(true)
}

async function cli (args) {
  const commands = mri(args)._
  const argc = commands.length

  if (argc > actions.max) {
    error(`Number of actions (${argc}) is more than allowed: ${actions.max}`)
    return
  }

  if (argc === 0) {
    await actions
      .runDefault(process.env.PWD)
      .catch(err => error(err))
    happy('Version completed. Yay!')
    return
  }

  // shouldn't run if git is not clean
  if (!isGitClean.sync()) {
    error('Please commit all files before publishing')
    return
  }

  if (await isRemoteAhead()) {
    error('Remote contains changes you don\'t have yet, please `git pull` before using nuup')
    return
  }

  // run all actions
  commands.map(async a => {
    await actions
      .run(a, process.env.PWD)
      .catch(err => error(err))
    happy(`${a} version published. Yay!`)
  })
}

cli(process.argv.slice(2))
