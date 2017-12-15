const { existsSync } = require('fs')
const test = require('ava').serial
const { shellSync } = require('execa')

const exe = shellSync
const cli = '../../index.js'

function createRepoAndExecuteAction (action) {
  return exe(`
    rm -rf tmp &&
    mkdir -p tmp/remote &&
    cd tmp/remote && git init &&
    git config receive.denyCurrentBranch updateInstead &&
    echo test >> test && git add test &&
    git commit -m test &&
    cd .. && git clone remote repo 2>&1 &&
    cd repo &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "Test" &&
    ${cli} ${action}
  `)
}

test('publishes patch by default', async t => {
  const { stdout, stderr } = createRepoAndExecuteAction('')
  t.regex(stdout, /Updated version in package.json 0.0.0 => 0.0.1/)
  t.regex(stdout, /Version completed/)
  t.falsy(stderr)
})

test('publishes minor version', async t => {
  const { stdout, stderr } = createRepoAndExecuteAction('minor')
  t.regex(stdout, /Updated version in package.json 0.0.0 => 0.1.0/)
  t.regex(stdout, /minor version published/)
  t.falsy(stderr)
})

test('publishes major version', async t => {
  const { stdout, stderr } = createRepoAndExecuteAction('major')
  t.regex(stdout, /Updated version in package.json 0.0.0 => 1.0.0/)
  t.regex(stdout, /major version published/)
  t.falsy(stderr)
})

test('publishes two versions', async t => {
  const { stdout, stderr } = exe(`
    rm -rf tmp &&
    mkdir -p tmp/remote &&
    cd tmp/remote &&
    git init &&
    git config receive.denyCurrentBranch updateInstead &&
    echo test >> test && git add test &&
    git commit -m test && cd .. &&
    git clone remote repo 2>&1 && cd repo &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "First version" &&
    ${cli} major &&
    echo test >> test.txt &&
    git add -A &&
    git commit -m "Second version" &&
    ${cli} major
  `)
  t.regex(stdout, /Updated version in package.json 0.0.0 => 1.0.0/)
  t.regex(stdout, /Updated version in package.json 1.0.0 => 2.0.0/)
  t.falsy(stderr)
})

test('fails without commits between tags', async t => {
  // execute index.js twice
  const { stderr } = createRepoAndExecuteAction(`major &&
    ${cli}`)
  t.regex(stderr, /There are no commits since version 1.0.0/)
})

test('fails with unknown action', async t => {
  const { stderr } = createRepoAndExecuteAction('foo')
  t.regex(stderr, /Error: Unknown action "foo"/)
})

test('fails with uncommited files', async t => {
  const { stderr } = exe(`
    rm -rf tmp &&
    mkdir -p tmp/remote &&
    cd tmp/remote &&
    git init &&
    echo test >> test && git add test &&
    git commit -m test && cd .. &&
    git clone remote repo &&
    cd repo &&
    echo '{ "version": "0.0.0" }' > package.json &&
    ${cli} minor
  `)
  t.regex(stderr, /Please commit all files before publishing/)
})

test('fails with too many arguments', async t => {
  const { stderr } = createRepoAndExecuteAction('foo bar')
  t.regex(stderr, /Number of actions \(2\) is more than allowed: 1/)
})

test('fails when the remote is ahead of repo', async t => {
  const { stderr } = exe(`
    rm -rf tmp &&
    mkdir -p tmp/remote &&
    cd tmp/remote && git init &&
    git config receive.denyCurrentBranch updateInstead &&
    echo '{ "version": "1.0.0" }' > package.json &&
    git add package.json && git commit -m v1 &&
    cd .. && git clone remote repo &&
    cd repo &&
    echo '{ "version": "2.0.0" }' > package.json &&
    git add package.json && git commit -m v2 &&
    cd ../remote &&
    echo '{ "version": "3.0.0" }' > package.json &&
    git add package.json && git commit -m v3 &&
    cd ../repo &&
    ${cli}
  `)
  t.regex(stderr, /Remote contains changes you don't have yet, please `git pull` before using/)
})

test('creates package-lock.json', async t => {
  createRepoAndExecuteAction('')
  const exists = existsSync('./tmp/repo/package-lock.json')
  t.true(exists)
})
