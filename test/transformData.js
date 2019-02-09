"use strict"

var bl = require("bl");
var should = require("should");
var transformData = require("../lib/transformData");

describe("transformData", function() {
  var data
  beforeEach(function() {
    data = {
    	"": true,
    	a: {
    		"": true,
    		index: new Buffer("1"), // /a/index
    		dir: {
    			"": true,
    			index: new Buffer("2") // /a/dir/index
    		}
    	},
    	"C:": {
    		"": true,
    		a: {
    			"": true,
    			index: new Buffer("3"), // C:\files\index
    			dir: {
    				"": true,
    				index: new Buffer("4") // C:\files\a\index
    			}
    		}
    	}
    }
  })
	it("should transform data", function() {
    const memfsData = transformData(data)
    console.log(memfsData)
  })
})
