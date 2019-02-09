/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const {Volume} = require("memfs");
const normalize = require("./normalize");
const join = require("./join");
const pathToArray = require("./pathToArray");
const transformData = require("./transformData");


class MemoryFileSystem extends Volume {
	constructor(data, memfsData, props) {
		super(props);
		if (data || memfsData) {
			// don't mutate memfsData
			const json = memfsData ? Object.assign({}, memfsData) : memfsData
			// memfs uses a different JSON data structure
			this.fromJSON(transformData(data, json), '/');
		}
		this.join = join;
		this.normalize = normalize;
		this.pathToArray = pathToArray;
	}
}

module.exports = MemoryFileSystem;
