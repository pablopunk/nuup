'use strict'

const mri = require('mri')
const isGitClean = require('is-git-clean')
const actions = require('./lib/actions')
const { error, happy } = require('./lib/log')

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

  // run all actions
  commands.map(async a => {
    await actions
      .run(a, process.env.PWD)
      .catch(err => error(err))
    happy(`${a} version published. Yay!`)
  })
}

module.exports = cli
