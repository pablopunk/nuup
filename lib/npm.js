const writeJson = require('write-json-file')
const execa = require('execa')

async function updateVersion (state) {
  return writeJson(
    state.pkgFile,
    Object.assign(state.pkg, {
      version: state.newVersion
    }),
    { detectIndent: true }
  ).then(() => state)
}

async function install (state) {
  return execa('npm', ['install'], { cwd: state.options.dirname }).then(() => state)
}

/* istanbul ignore next */
async function publish (state) {
  if (process.env.NODE_ENV === 'test') {
    return state
  }

  return execa('npm', ['publish'], { cwd: state.options.dirname })
    .then(() => state)
}

module.exports = {
  updateVersion,
  install,
  publish
}
