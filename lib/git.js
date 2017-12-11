'use strict'

const isGitClean = require('is-git-clean')

module.exports.isClean = isGitClean.sync
