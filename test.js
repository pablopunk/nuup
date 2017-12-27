const {existsSync} = require('fs')
const test = require('ava').serial
const {shellSync} = require('execa')

const exe = shellSync
const cli = '../../index.js'

function createRepoAndExecuteAction(action) {
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
  const {stdout} = createRepoAndExecuteAction('')
  t.regex(stdout, /0.0.0 to 0.0.1/)
})

test('publishes minor version', async t => {
  const {stdout} = createRepoAndExecuteAction('minor')
  t.regex(stdout, /0.0.0 to 0.1.0/)
})

test('publishes major version', async t => {
  const {stdout} = createRepoAndExecuteAction('major')
  t.regex(stdout, /0.0.0 to 1.0.0/)
})

test('publishes custom version', async t => {
  const {stdout} = createRepoAndExecuteAction('8.4.2')
  t.regex(stdout, /0.0.0 to 8.4.2/)
})

test('publishes two versions', async t => {
  const {stdout} = exe(`
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
  t.regex(stdout, /0.0.0 to 1.0.0/)
  t.regex(stdout, /1.0.0 to 2.0.0/)
})

test('fails without commits between tags', async t => {
  // Execute index.js twice
  const {stdout} = createRepoAndExecuteAction(`major &&
    ${cli}`)
  t.regex(stdout, /There are no commits since version 1.0.0/)
})

test('fails with unknown action', async t => {
  const {stdout} = createRepoAndExecuteAction('foo')
  t.regex(stdout, /Unknown action "foo"/)
})

test('fails with uncommitted files', async t => {
  const {stdout} = exe(`
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
  t.regex(stdout, /Please commit all files before publishing/)
})

test('fails with too many arguments', async t => {
  const {stdout} = createRepoAndExecuteAction('foo bar')
  t.regex(stdout, /Number of actions \(2\) is more than allowed: 1/)
})

test('fails when the remote is ahead of repo', async t => {
  const {stdout} = exe(`
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
  t.regex(stdout, /Remote contains changes you don't have yet, please `git pull` before using/)
})

test('fails if there\'s no package with version', async t => {
  const {stdout} = exe(`
    rm -rf tmp &&
    mkdir -p tmp/remote &&
    cd tmp/remote && git init &&
    git config receive.denyCurrentBranch updateInstead &&
    echo '{ "name": "nope" }' >> package.json &&
    git add package.json && git commit -m package &&
    cd .. && git clone remote repo &&
    cd repo &&
    ${cli}
  `)
  t.regex(stdout, /Can't find a package version/)
})

test('creates package-lock.json', async t => {
  createRepoAndExecuteAction('')
  const exists = existsSync('./tmp/repo/package-lock.json')
  t.true(exists)
})
