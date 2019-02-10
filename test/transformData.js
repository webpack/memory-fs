"use strict"

var bl = require("bl");
var should = require("should");
var transformData = require("../lib/transformData");
var MemoryFileSystem = require("../lib/MemoryFileSystem");

describe("transformData", function() {
	describe("posix paths", function() {
		var data
		var json
		beforeEach(function() {
			data = {
				"": true,
				a: {
					"": true,
					index: new Buffer("1"), // /a/index
					dir: {
						"": true,
						index: new Buffer("2") // /a/dir/index
					},
					b: {"": true}
				}
			}
			json = {
				'/a/b': null,
				'/a/dir/index': '2',
				'/a/index': '1'
			};
		})
		it("should transform data", function() {
			transformData(data).should.be.eql(json);
		});
		it("should create volume with data", function() {
			const fs = new MemoryFileSystem(data)
			fs.toJSON().should.be.eql(json);
		});
		it("should export data", function() {
			const fs = new MemoryFileSystem(data);
			fs.data.should.be.eql(data);
		});
		it("should set data", function() {
			const fs = new MemoryFileSystem()
			fs.data = data;
			fs.toJSON().should.be.eql(json);
		});
	})
	describe("win32 paths", function() {
		var data
		var json
		beforeEach(function() {
			data = {
				"": true,
				"C:": {
					"": true,
					a: {
						"": true,
						index: new Buffer("3"), // C:\files\index
						dir: {
							"": true,
							index: new Buffer("4") // C:\files\a\index
						},
						b: {"": true}
					}
				}
			}
			json = {
				'C:\\a\\b': null,
				'C:\\a\\dir\\index': '4',
				'C:\\a\\index': '3'
			};
		})
		it("should transform data", function() {
			transformData(data).should.be.eql(json);
		});
		it("should create volume with data", function() {
			const fs = new MemoryFileSystem(data)
			fs.toJSON().should.be.eql(json);
		});
		it("should export data", function() {
			const fs = new MemoryFileSystem(data);
			fs.data.should.be.eql(data);
		});
		it("should set data", function() {
			const fs = new MemoryFileSystem()
			fs.data = data;
			fs.toJSON().should.be.eql(json);
		});
	})

})
