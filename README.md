# nuup

<p align="center">
  <a href="https://travis-ci.org/pablopunk/nuup"><img src="https://img.shields.io/travis/pablopunk/nuup.svg" /></a>
  <a href="https://codecov.io/gh/pablopunk/nuup"><img src="https://img.shields.io/codecov/c/github/pablopunk/nuup.svg" /></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" /></a>
  <a href="https://github.com/pablopunk/miny"><img src="https://img.shields.io/badge/made_with-miny-1eced8.svg" /></a>
  <a href="https://www.npmjs.com/package/nuup"><img src="https://img.shields.io/npm/dt/nuup.svg" /></a>
</p>

<p align="center">
  <i>Yet another npm publish with superpowers.</i>
</p>

*nuup* takes care of changing the version in your `package.json`: **tag**, **commit** and **push**.

## Install

```sh
npm install -g nuup
```


## Usage

```sh
$ nuup [patch, minor, major, <version>]
```

[![asciicast](https://asciinema.org/a/TmCFYO8SZ6t7K5S6DbSof6sNG.svg)](https://asciinema.org/a/TmCFYO8SZ6t7K5S6DbSof6sNG)

### Examples

```sh
$ nuup # default action is patch
0.0.0 => 0.0.1
$ nuup patch
0.0.1 => 0.0.2
$ nuup minor
0.0.2 => 0.1.0
$ nuup major
0.1.0 => 1.0.0
$ nuup 9.8.7
1.0.0 => 9.8.7
```

#### Options

* `[--version | -v]`

Show *nuup* version


## License

MIT


## Author

| ![me](https://gravatar.com/avatar/fa50aeff0ddd6e63273a068b04353d9d?size=100)           |
| --------------------------------- |
| [Pablo Varela](https://pablo.life)   |

