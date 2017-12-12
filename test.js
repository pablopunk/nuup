const test = require('ava')
const { shellSync } = require('execa')

const exe = shellSync

test('publishes patch by default', async t => {
  exe('rm -rf tmp')
  const { stdout } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "Test" &&
    ../cli.js
  `)
  t.regex(stdout, /Updated version in package.json 0.0.0 => 0.0.1/)
  t.regex(stdout, /Version completed/)
})

test('publishes minor version', async t => {
  exe('rm -rf tmp')
  const { stdout } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "Test" &&
    ../cli.js minor
  `)
  t.regex(stdout, /Updated version in package.json 0.0.0 => 0.1.0/)
})

test('publishes major version', async t => {
  exe('rm -rf tmp')
  const { stdout } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "Test" &&
    ../cli.js major
  `)
  t.regex(stdout, /Updated version in package.json 0.0.0 => 1.0.0/)
})

test('fails with more than 1 action', async t => {
  exe('rm -rf tmp')
  const { stderr } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    git config user.email "my@email.com" &&
    git config user.name "My Name" &&
    echo '{ "version": "0.0.0" }' > package.json &&
    git add -A &&
    git commit -m "Test" &&
    ../cli.js asd
  `)
  t.regex(stderr, /Error: Unknown action "asd"/)
})

test('fails with uncommited files', async t => {
  exe('rm -rf tmp')
  const { stderr } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    echo '{ "version": "0.0.0" }' > package.json &&
    ../cli.js minor
  `)
  t.regex(stderr, /Please commit all files before publishing/)
})

test('fails with too many arguments', async t => {
  exe('rm -rf tmp')
  const { stderr } = exe(`
    mkdir tmp &&
    cd tmp &&
    git init &&
    ../cli.js asd xyz
  `)
  t.regex(stderr, /Number of actions \(2\) is more than allowed: 1/)
})
