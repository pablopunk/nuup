const chalk = require('chalk')
module.exports = {
  error: m => console.log(chalk.red(`🔥  ${m}`)),
  happy: m => console.log(chalk.green(`🌈  ${m}`)),
  log: m => console.log(chalk.blue(`👉  ${m}`))
}
