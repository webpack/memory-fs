/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const {Volume} = require("memfs");
const normalize = require("./normalize");
const pathToArray = require("./pathToArray");
const join = require("./join");
const transformData = require("./transformData");
const transformJSON = require("./transformJSON");

class MemoryFileSystem extends Volume {
	constructor(data, json, cwd, props) {
		super(props);
		if (data) {
			// memfs uses a different JSON data structure than memory-fs
			this.fromJSON(transformData(data, json ? Object.assign({}, json) : json), cwd);
		} else if (json) {
			this.fromJSON(json, cwd);
		}
		this.join = join;
		this.pathToArray = pathToArray;
		this.normalize = normalize;
	}
	get data() {
		return transformJSON(this.toJSON());
	}
	set data(data) {
		this.fromJSON(transformData(data));
	}
}

module.exports = MemoryFileSystem;
