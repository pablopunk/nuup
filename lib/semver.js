'use strict'

const semverRegex = require('semver-regex')

const version = {
  major: 0,
  minor: 1,
  patch: 2
}

const isSemver = str => semverRegex().test(str)
const splitVersion = str => str.split('.')
const completeVersion = arr => {
  for (let i = arr.length; i < Object.keys(version).length; i++) {
    arr.push(0)
  }
  return arr
}

const add = (str, type) => {
  const versionArr = splitVersion(str)
  let result = []
  for (let versionType in version) {
    const i = version[versionType]
    const num = parseInt(versionArr[i])
    if (versionType === type) {
      result.push(num + 1)
      break
    } else {
      result.push(num)
    }
  }
  result = completeVersion(result)
  return result.join('.')
}

const checkStrAndAdd = (str, type) => {
  if (!isSemver(str)) {
    throw new Error(`${str} is not a semver string`)
  }
  return add(str, type)
}

for (let type in version) {
  module.exports[type] = function (str) {
    return checkStrAndAdd(str, type)
  }
}
