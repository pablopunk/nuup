'use strict'

const path = require('path')
const writeJson = require('write-json-file')
const execa = require('execa')
const commitsBetween = require('commits-between')
const isSemver = require('is-semver')
const ora = require('ora')
const semver = require('./semver')

const defaultAction = 'patch'

let state

function updateVersionInPackage () {
  return writeJson(
    state.pkgFile,
    Object.assign(state.pkg, {
      version: state.newVersion
    }),
    { detectIndent: true }
  )
}

function npmInstall () {
  return execa('npm', ['install'], { cwd: state.dirname })
}

function checkCommitsBetweenTags () {
  return commitsBetween({
    from: state.oldVersion,
    cwd: state.dirname
  })
}

function getLatestTag () {
  return execa('git', ['describe', '--abbrev=0', '--tags'], {
    cwd: state.dirname
  })
    .then(({ stdout }) => {
      return stdout.trim()
    })
    .catch(() => '')
}

function commitFiles () {
  let cmd = `git add package.json package-lock.json && git commit -m ${
    state.newVersion
  } && git tag ${state.newVersion} && git push`
  return execa.shell(cmd, { cwd: state.dirname })
}

/* istanbul ignore next */
function npmPublish () {
  if (process.env.NODE_ENV === 'test') {
    return new Promise(resolve => resolve(''))
  }
  return execa('npm', ['publish'], { cwd: state.dirname })
}

function commitsSinceVersion () {
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

async function checkTagsAndUpdateVersion () {
  let spinner = ora({
    text: `Updating version ${state.oldVersion} to ${state.newVersion}`,
    stream: process.stdout
  }).start()

  return commitsSinceVersion()
    .then(updateVersionInPackage)
    .then(npmInstall)
    .then(() => {
      spinner.succeed(
        `Updated version ${state.oldVersion} to ${state.newVersion}`
      )
      spinner = ora({
        text: 'Commit and push',
        stream: process.stdout
      }).start()
      return new Promise(resolve => resolve())
    })
    .then(commitFiles)
    .then(() => {
      spinner.succeed('Commited and pushed')
      spinner = ora({
        text: 'Publishing to npm',
        stream: process.stdout
      }).start()
      return new Promise(resolve => resolve())
    })
    .then(npmPublish)
    .then(() => {
      spinner.succeed('Published to npm')
      return new Promise(resolve => resolve(state))
    })
    .catch(err => spinner.fail(err.message))
}

function act (action, dirname) {
  const pkgFile = path.join(dirname, 'package.json')
  const pkg = require(pkgFile)
  const oldVersion = pkg.version

  if (!pkg.version) {
    throw new Error("Can't find a package version")
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

    return checkTagsAndUpdateVersion()
  }

  throw new Error(`Unknown action "${action}"`)
}

module.exports.run = act
module.exports.runDefault = dirname => act(defaultAction, dirname)
module.exports.max = 1
