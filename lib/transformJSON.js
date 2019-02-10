"use strict"

const pathToArray = require("./pathToArray");

module.exports = function transformJSON(json, data = {}, parentPathname = '') {
	const paths = Object.keys(json)
	paths.forEach((path) => {
		const pathData = json[path]
		const isDir = pathData === null
		const parts = pathToArray(path)
		const lastIndex = parts.length - 1
		let dataPart = data
		parts.forEach((part, i) => {
			if (i === lastIndex && !isDir) {
				dataPart[part] = new Buffer(pathData)
			} else {
				if (!dataPart[part]) {
					dataPart[part] = {"": true}
				}
				dataPart = dataPart[part]
			}
		})
	})
	data[""] = true
	return data
};
