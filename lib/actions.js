'use strict'

const chalk = require('chalk')
const semver = require('./semver')
const { replaceJson } = require('./fs')

function act (action, dirname) {
  const pkgFile = `${dirname}/package.json`
  const pkg = require(pkgFile)

  if (typeof semver[action] === 'function') {
    const current = pkg.version
    const latest = semver[action](current)

    // update package.json
    replaceJson(pkgFile, Object.assign(pkg, {
      version: latest
    }), err => {
      if (err) {
        throw err
      }
      console.log(chalk.blue(`Updated version ${current} => ${latest}`))
    })
    return
  }

  throw new Error(`Unknown action "${action}"`)
}

module.exports.do = act
module.exports.max = 1
