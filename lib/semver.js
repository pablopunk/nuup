const version = {
	major: 0,
	minor: 1,
	patch: 2,
};

const splitVersion = (str) => str.split(".");
const completeVersion = (arr) => {
	for (let i = arr.length; i < Object.keys(version).length; i++) {
		arr.push(0);
	}
	return arr;
};

const add = (str, type) => {
	const versionArr = splitVersion(str);
	let result = [];
	for (const versionType in version) {
		/* istanbul ignore else */
		if (Object.prototype.hasOwnProperty.call(version, versionType)) {
			const i = version[versionType];
			const num = Number.parseInt(versionArr[i], 10);
			if (versionType === type) {
				result.push(num + 1);
				break;
			} else {
				result.push(num);
			}
		}
	}
	result = completeVersion(result);
	return result.join(".");
};

for (const type in version) {
	/* istanbul ignore else */
	if (Object.prototype.hasOwnProperty.call(version, type)) {
		module.exports[type] = (str) => add(str, type);
	}
}
