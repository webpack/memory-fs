var bl = require("bl");
var should = require("should");
var MemoryFileSystem = require("../lib/MemoryFileSystem");
var MemoryFileSystemError = require("../lib/MemoryFileSystemError");

describe("error", function() {
	function catchError(fn) {
		try {
			fn();
		} catch(e) {
			return e;
		}
		return null;
	}

	it("should include the path in Error message", function(done) {
		var fs = new MemoryFileSystem();
		var invalidPath = "/nonexist/file";
		var error = catchError(function() {
			fs.statSync(invalidPath);
		});
		error.message.should.containEql(invalidPath);

		fs.readFile(invalidPath, function(err) {
			err.message.should.containEql(invalidPath);
			done();
		});
	});
	it("should use correct error message in the first line of Error stack", function(done) {
		var fs = new MemoryFileSystem();
		fs.unlink("/test/abcd", function(error) {
			error.should.be.instanceof(Error);
			error.stack.should.startWith(error.name);

			var firstLine = error.stack.split(/\r\n|\n/)[0];
			firstLine.should.containEql(error.code);
			firstLine.should.containEql(error.message);
			firstLine.should.containEql(error.operation);
			done();
		});
	});
	it("should work fine without operation name", function() {
		var errorData = {
			code:"ETEST",
			description:"testerror"
		};
		var errorPath = "file";
		var error = new MemoryFileSystemError(errorData, errorPath);
		error.message.should.startWith(error.code);
		error.stack.should.startWith(error.name);
		error.stack.should.containEql(error.message);
		error.stack.should.containEql(errorPath);
	});
});
