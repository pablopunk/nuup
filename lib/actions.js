'use strict'

const path = require('path')
const writeJson = require('write-json-file')
const execa = require('execa')
const commitsBetween = require('commits-between')
const isSemver = require('is-semver')
const spinner = require('./spinner')
const semver = require('./semver')

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
  return execa('npm', ['install'], {cwd: state.dirname})
}

function checkCommitsBetweenTags() {
  return commitsBetween({
    from: state.oldVersion,
    cwd: state.dirname
  })
}

function getLatestTag() {
  return execa('git', ['describe', '--abbrev=0', '--tags'], {
    cwd: state.dirname
  })
    .then(({stdout}) => {
      return stdout.trim()
    })
    .catch(() => '')
}

function commitFiles() {
  const cmd = `git add package.json package-lock.json && git commit -m ${
    state.newVersion
  } && git tag ${state.newVersion} && git push`
  return execa.shell(cmd, {cwd: state.dirname})
}

/* istanbul ignore next */
function npmPublish() {
  if (process.env.NODE_ENV === 'test') {
    return emptyPromise()
  }
  return execa('npm', ['publish'], {cwd: state.dirname})
}

function commitsSinceVersion() {
  return getLatestTag().then(latestTag => {
    if (latestTag && latestTag === state.oldVersion) {
      return checkCommitsBetweenTags().then(commits => {
        if (commits.length === 0) {
          return Promise.reject(
            new Error(`There are no commits since version ${state.oldVersion}`)
          )
        }
      })
    }
  })
}

async function checkTagsAndUpdateVersion(forceCommit = false) {
  spinner.start(`Updating version ${state.oldVersion} to ${state.newVersion}`)

  const promiseToResolve = forceCommit ? emptyPromise : commitsSinceVersion

  return promiseToResolve()
    .then(updateVersionInPackage)
    .then(npmInstall)
    .then(() => {
      spinner.stop(`Updated version ${state.oldVersion} to ${state.newVersion}`)
      spinner.start('Commit and push')
    })
    .then(commitFiles)
    .then(() => {
      spinner.stop('Committed and pushed')
      spinner.start('Publishing to npm')
    })
    .then(npmPublish)
    .then(() => {
      spinner.stop('Published to npm')
      return Promise.resolve(state)
    })
    .catch(err => spinner.fail(err.message))
}

function act(action, dirname) {
  const pkgFile = path.join(dirname, 'package.json')
  const pkg = require(pkgFile)
  const oldVersion = pkg.version

  if (!pkg.version) {
    throw new Error('Can\'t find a package version')
  }

  if (typeof semver[action] === 'function') {
    const newVersion = semver[action](oldVersion)

    state = {
      pkg,
      pkgFile,
      newVersion,
      oldVersion,
      dirname
    }

    return checkTagsAndUpdateVersion()
  }

  if (isSemver(action)) {
    const newVersion = action

    state = {
      pkg,
      pkgFile,
      newVersion,
      oldVersion,
      dirname
    }

    return checkTagsAndUpdateVersion(true)
  }

  throw new Error(`Unknown action "${action}"`)
}

module.exports.run = act
module.exports.runDefault = dirname => act(defaultAction, dirname)
module.exports.max = 1
