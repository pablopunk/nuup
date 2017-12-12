'use strict'

const path = require('path')
const writeJson = require('write-json-file')
const execa = require('execa')
const commitsBetween = require('commits-between')
const semver = require('./semver')
const { log, happy } = require('./log')

const defaultAction = 'patch'

function updateVersionInPackage (file, content, latest) {
  return writeJson(
    file,
    Object.assign(content, {
      version: latest
    }),
    { detectIndent: true }
  )
}

function checkCommitsBetweenTags (oldVersion, dirname) {
  return commitsBetween({
    from: oldVersion,
    cwd: dirname
  })
}

function getLatestTag (dirname) {
  return execa('git', ['describe', '--abbrev=0', '--tags'], { cwd: dirname })
    .then(({ stdout }) => {
      return parseInt(stdout.trim())
    })
    .catch(() => '')
}

function commitFile (dirname, file, version) {
  let cmd = `git add ${file} && git commit -m ${version} && git tag ${version}`
  if (process.env.NODE_ENV !== 'test') {
    cmd += ' && git push'
  }
  return execa.shell(cmd, { cwd: dirname })
}

function npmPublish (dirname) {
  if (process.env.NODE_ENV === 'test') {
    return new Promise()
  }
  return execa('npm', ['publish'], { cwd: dirname })
}

async function checkTagsAndUpdateVersion ({
  pkg,
  pkgFile,
  latest,
  current,
  dirname
}) {
  const latestTag = await getLatestTag(dirname)
  if (!latestTag) {
    happy(`This is the first time you use nuup, congrats!`)
  } else {
    const commits = await checkCommitsBetweenTags(current, dirname)
    if (commits.length === 0) {
      return Promise.reject(new Error(`There are no commits since version ${current}`))
    }
  }

  await updateVersionInPackage(pkgFile, pkg, latest)
  log(`Updated version in package.json ${current} => ${latest}`)

  await commitFile(dirname, 'package.json', latest)
  log(`Commit version ${latest}`)

  return npmPublish(dirname)
    .then(() => {
      log(`Published to npm`)
    })
}

function act (action, dirname) {
  const pkgFile = path.join(dirname, 'package.json')
  const pkg = require(pkgFile)

  if (typeof semver[action] === 'function') {
    const current = pkg.version
    const latest = semver[action](current)

    return checkTagsAndUpdateVersion({
      pkg,
      pkgFile,
      latest,
      current,
      dirname
    })
  }

  return Promise.reject(new Error(`Unknown action "${action}"`))
}

module.exports.run = act
module.exports.runDefault = dirname => act(defaultAction, dirname)
module.exports.max = 1
