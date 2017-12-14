'use strict'

const version = {
  major: 0,
  minor: 1,
  patch: 2
}

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

for (let type in version) {
  module.exports[type] = function (str) {
    return add(str, type)
  }
}
