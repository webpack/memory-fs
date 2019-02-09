/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const {Volume} = require("memfs");
const normalize = require("./normalize");
const join = require("./join");
const transformData = require("./transformData");


class MemoryFileSystem extends Volume {
	constructor(data, memfsData, props) {
		super(props);
		if (data || memfsData) {
			// memfs uses a different JSON data structure
			this.fromJSON(transformData(data, memfsData), '/');
		}
		this.join = join;
		this.normalize = normalize;
	}
}

module.exports = MemoryFileSystem;
