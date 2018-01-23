const writeJson = require('write-json-file')
const execa = require('execa')
const {emptyPromise} = require('./util')

function updateVersion(state) {
  return writeJson(
    state.pkgFile,
    Object.assign(state.pkg, {
      version: state.newVersion
    }),
    {detectIndent: true}
  )
}

function install(state) {
  return execa('npm', ['install'], {cwd: state.options.dirname})
}

/* istanbul ignore next */
function publish(state) {
  if (process.env.NODE_ENV === 'test') {
    return emptyPromise()
  }
  return execa('npm', ['publish'], {cwd: state.options.dirname})
}

module.exports = {
  updateVersion,
  install,
  publish
}
