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
    ../index.js
  `)
  t.regex(stdout, /Updated version in package.json 0.0.0 => 0.0.1/)
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
    ../index.js minor
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
    ../index.js major
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
    ../index.js asd
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
    ../index.js minor
  `)
  t.regex(stderr, /Please commit all files before publishing/)
})
