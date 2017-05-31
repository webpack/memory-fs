
"use strict";

const operationMatchReg = new RegExp("at\\sMemoryFileSystem\\.([^\\s_]+)\\s");

class MemoryFileSystemError extends Error {
	constructor(err, path) {
		super(err, path);

		// Set `name` and `message` before call `Error.captureStackTrace` \
		// so that we will obtain the correct 1st line of stack, like:
		// [Error]: [Message]
		this.name = this.constructor.name;
		this.message = `${err.code}: ${err.description}`;

		// Add operation name into error message, similar to node `fs` style.
		// It will not exactly same as node `fs`'s result which comes from \
		// the native call (like `readFile` => `binding.open` => `open`),
		// but just find out the last method call from the stack.
		var operation = this.findOperation();
		if(operation && path) {
			this.message += `, ${operation} \'${path}\'`;
		} else if(path) {
			this.message += `, \'${path}\'`;
		}
		this.code = err.code;
		this.errno = err.errno;
		this.path = path;

		if(Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
	findOperation() {
		// use a new obj to capture and inspect stack, because the message \
		// isn't ready yet, shouldn't invoke stack getter at this time.
		var captureObj = {};
		if(Error.captureStackTrace) {
			Error.captureStackTrace(captureObj);
		}
		if(!captureObj.stack) return null;
		var stacks = captureObj.stack.split(/[\r\n|\n][\s]*/);
		var findDepth = 1;
		var operation;
		while(!operation && findDepth < stacks.length) {
			var stack = stacks[findDepth];
			var operationMatch = stack.match(operationMatchReg);
			if(operationMatch) {
				operation = operationMatch[1];
			}
			findDepth += 1;
		}

		return operation;
	}
}

module.exports = MemoryFileSystemError;
