const { existsSync } = require("fs");
const path = require("path");
const isSemver = require("is-semver");
const spinner = require("./spinner");
const semver = require("./semver");
const npm = require("./npm");
const { commitsSinceVersion, commitFiles } = require("./git");

const defaultAction = "patch";

let state;

async function logVersions(state) {
	spinner.stop(`Updated version ${state.oldVersion} to ${state.newVersion}`);
	spinner.start("Commit and push");

	return state;
}

async function logCommited(state) {
	spinner.stop("Committed and pushed");

	return state;
}

async function done() {
	spinner.stop("Done! You should be able to `npm publish` now");
}

async function checkTagsAndUpdateVersion(forceCommit) {
	spinner.start(`Updating version ${state.oldVersion} to ${state.newVersion}`);

	const promiseToResolve = forceCommit
		? () => new Promise((resolve) => resolve(state))
		: commitsSinceVersion;

	return promiseToResolve(state)
		.then(npm.updateVersion)
		.then(logVersions)
		.then(commitFiles)
		.then(logCommited)
		.then(done)
		.catch((err) => spinner.fail(err.message));
}

function act(action, options) {
	const pkgFile = path.join(options.dirname, "package.json");
	const pkg = require(pkgFile);
	const oldVersion = pkg.version;
	let forceCommit = false;

	state = {
		pkg,
		pkgFile,
		oldVersion,
		options,
	};

	if (!pkg.version) {
		throw new Error("Can't find a package version");
	}

	if (typeof semver[action] === "function") {
		const newVersion = semver[action](oldVersion);

		state = { ...state, newVersion };
	}

	if (isSemver(action)) {
		const newVersion = action;

		state = { ...state, newVersion };
		forceCommit = true;
	}

	if (!state.newVersion) {
		throw new Error(`Unknown action "${action}"`);
	}

	return checkTagsAndUpdateVersion(forceCommit);
}

module.exports.run = act;
module.exports.runDefault = (options) => act(defaultAction, options);
module.exports.max = 1;
