const ora = require("ora");

let spinner;

const start = (text) => {
	spinner = ora({ text, stream: process.stdout }).start();
};

const stop = (text) => {
	spinner.succeed(text);
};

const fail = (text) => {
	if (!spinner) {
		start("");
	}
	spinner.fail(text);
};

module.exports = {
	start,
	stop,
	fail,
};
