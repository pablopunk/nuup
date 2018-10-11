const execa = require('execa')
const commitsBetween = require('commits-between')

function commitsBetweenVersions (state) {
  return commitsBetween({
    from: state.oldVersion,
    cwd: state.options.dirname
  })
}

function getLatestTag (state) {
  return execa('git', ['describe', '--abbrev=0', '--tags'], {
    cwd: state.options.dirname
  })
    .then(({ stdout }) => {
      return stdout.trim()
    })
    .catch(() => '')
}

async function commitsSinceVersion (state) {
  const latestTag = await getLatestTag(state)
  if (latestTag && latestTag === state.oldVersion) {
    const commits = await commitsBetweenVersions(state)
    if (commits.length === 0) {
      throw new Error(`There are no commits since version ${state.oldVersion}`)
    }
  }

  return state
}

function commitFiles (state) {
  const cmd = `git add package* && git commit -m ${
    state.newVersion
  } && git tag ${state.newVersion} && git push && git push --tags`

  return execa
    .shell(cmd, { cwd: state.options.dirname })
    .then(() => state)
}

module.exports = {
  commitsSinceVersion,
  commitFiles
}
