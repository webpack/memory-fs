"use strict"

var should = require("should");
var transformJSON = require("../lib/transformJSON");
var MemoryFileSystem = require("../lib/MemoryFileSystem");

describe("transformJSON", function() {
	var json
	var data
	beforeEach(function() {
		json = {
			'/a/b': null,
			'/a/dir/index': '2',
			'/a/index': '1',
			'C:\\a\\b': null,
			'C:\\a\\dir\\index': '4',
			'C:\\a\\index': '3'
		};
		data = {
			"": true,
			a: {
				"": true,
				b: {"": true},
				dir: {
					"": true,
					index: new Buffer("2") // /a/dir/index
				},
				index: new Buffer("1") // /a/index
			},
			"C:": {
				"": true,
				a: {
					"": true,
					b: {"": true},
					dir: {
						"": true,
						index: new Buffer("4") // C:\files\a\index
					},
					index: new Buffer("3") // C:\files\index
				}
			}
		};
	})
	it("should transform json", function() {
		transformJSON(json).should.be.eql(data);
	});
	it("should create volume with json", function() {
		const fs = new MemoryFileSystem(null, json)
		fs.toJSON().should.be.eql(json);
	});
	it("should export data", function() {
		const fs = new MemoryFileSystem(null, json)
		fs.data.should.be.eql(data);
	});
})
