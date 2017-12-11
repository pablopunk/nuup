'use strict'

const { writeFile } = require('fs')

function replaceJson (filename, newJson, callback) {
  writeFile(filename, JSON.stringify(newJson, null, 2), callback)
}

module.exports.replaceJson = replaceJson
