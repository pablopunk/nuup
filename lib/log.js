const chalk = require('chalk')
module.exports = {
  error: m => console.error(chalk.red(`🔥  ${m}`)),
  happy: m => console.log(chalk.green(`🌈  ${m}`)),
  log: m => console.log(chalk.blue(`👉  ${m}`)),
  success: m => console.log(chalk.green(`✓ ${m}`))
}
