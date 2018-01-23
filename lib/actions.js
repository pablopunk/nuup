'use strict'

const path = require('path')
const writeJson = require('write-json-file')
const execa = require('execa')
const isSemver = require('is-semver')
const spinner = require('./spinner')
const semver = require('./semver')
const {commitsSinceVersion, commitFiles} = require('./git')

const defaultAction = 'patch'

const emptyPromise = () => new Promise(resolve => resolve())

let state

function updateVersionInPackage() {
  return writeJson(
    state.pkgFile,
    Object.assign(state.pkg, {
      version: state.newVersion
    }),
    {detectIndent: true}
  )
}

function npmInstall() {
  return execa('npm', ['install'], {cwd: state.options.dirname})
}

/* istanbul ignore next */
function npmPublish() {
  if (process.env.NODE_ENV === 'test') {
    return emptyPromise()
  }
  return execa('npm', ['publish'], {cwd: state.options.dirname})
}

async function checkTagsAndUpdateVersion(forceCommit) {
  spinner.start(`Updating version ${state.oldVersion} to ${state.newVersion}`)

  const promiseToResolve = forceCommit ? emptyPromise : commitsSinceVersion
  console.log(commitsSinceVersion)

  return promiseToResolve(state)
    .then(updateVersionInPackage)
    .then(npmInstall)
    .then(() => {
      spinner.stop(`Updated version ${state.oldVersion} to ${state.newVersion}`)
      spinner.start('Commit and push')
    })
    .then(() => commitFiles(state))
    .then(() => {
      spinner.stop('Committed and pushed')
      if (!state.options.noNpm) {
        spinner.start('Publishing to npm')
      }
    })
    .then(() => {
      if (!state.options.noNpm) {
        npmPublish()
      }
    })
    .then(() => {
      if (!state.options.noNpm) {
        spinner.stop('Published to npm')
      }
      return Promise.resolve(state)
    })
    .catch(err => spinner.fail(err.message))
}

function act(action, options) {
  const pkgFile = path.join(options.dirname, 'package.json')
  const pkg = require(pkgFile)
  const oldVersion = pkg.version
  let forceCommit = false

  state = {
    pkg,
    pkgFile,
    oldVersion,
    options
  }

  if (!pkg.version) {
    throw new Error('Can\'t find a package version')
  }

  if (typeof semver[action] === 'function') {
    const newVersion = semver[action](oldVersion)

    state = {...state, newVersion}
  }

  if (isSemver(action)) {
    const newVersion = action

    state = {...state, newVersion}
    forceCommit = true
  }

  if (!state.newVersion) {
    throw new Error(`Unknown action "${action}"`)
  }

  return checkTagsAndUpdateVersion(forceCommit)
}

module.exports.run = act
module.exports.runDefault = options => act(defaultAction, options)
module.exports.max = 1
