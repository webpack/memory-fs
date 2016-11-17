/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const normalize = require("./normalize");
const join = require("./join");
const errors = require("errno");
const stream = require("readable-stream");

const ReadableStream = stream.Readable;
const WritableStream = stream.Writable;

class MemoryFileSystemError extends Error {
	constructor(err, path) {
		super(err, path);
		if (Error.captureStackTrace)
			Error.captureStackTrace(this, this.constructor)
		this.code = err.code;
		this.errno = err.errno;
		this.message = err.description;
		this.path = path;
	}
}

function isDir(item) {
	if(typeof item !== "object") return false;
	return item[""] === true;
}

function isFile(item) {
	if(typeof item !== "object") return false;
	return !item[""];
}

function pathToArray(path) {
	path = normalize(path);
	const nix = /^\//.test(path);
	if(!nix) {
		if(!/^[A-Za-z]:/.test(path)) {
			throw new MemoryFileSystemError(errors.code.EINVAL, path);
		}
		path = path.replace(/[\\\/]+/g, "\\"); // multi slashs
		path = path.split(/[\\\/]/);
		path[0] = path[0].toUpperCase();
	} else {
		path = path.replace(/\/+/g, "/"); // multi slashs
		path = path.substr(1).split("/");
	}
	if(!path[path.length-1]) path.pop();
	return path;
}

function trueFn() { return true; }
function falseFn() { return false; }

class MemoryFileSystem {
	constructor(data) {
		this.data = data || {};
		this.join = join;
		this.pathToArray = pathToArray;
		this.normalize = normalize;
	}

	meta(_path) {
		const path = pathToArray(_path);
		let current = this.data;
		let i = 0;
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				return;
			current = current[path[i]];
		}
		return current[path[i]];
	}

	existsSync(_path) {
		return !!this.meta(_path);
	}

	statSync(_path) {
		let current = this.meta(_path);
		if(_path === "/" || isDir(current)) {
			return {
				isFile: falseFn,
				isDirectory: trueFn,
				isBlockDevice: falseFn,
				isCharacterDevice: falseFn,
				isSymbolicLink: falseFn,
				isFIFO: falseFn,
				isSocket: falseFn
			};
		} else if(isFile(current)) {
			return {
				isFile: trueFn,
				isDirectory: falseFn,
				isBlockDevice: falseFn,
				isCharacterDevice: falseFn,
				isSymbolicLink: falseFn,
				isFIFO: falseFn,
				isSocket: falseFn
			};
		} else {
			throw new MemoryFileSystemError(errors.code.ENOENT, _path);
		}
	}

	readFileSync(_path, encoding) {
		const path = pathToArray(_path);
		let current = this.data;
		let i = 0
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
			current = current[path[i]];
		}
		if(!isFile(current[path[i]])) {
			if(isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.EISDIR, _path);
			else
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
		}
		current = current[path[i]];
		return encoding ? current.toString(encoding) : current;
	}

	readdirSync(_path) {
		if(_path === "/") return Object.keys(this.data).filter(Boolean);
		const path = pathToArray(_path);
		let current = this.data;
		let i = 0;
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
			current = current[path[i]];
		}
		if(!isDir(current[path[i]])) {
			if(isFile(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOTDIR, _path);
			else
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
		}
		return Object.keys(current[path[i]]).filter(Boolean);
	}

	mkdirpSync(_path) {
		const path = pathToArray(_path);
		if(path.length === 0) return;
		let current = this.data;
		for(let i = 0; i < path.length; i++) {
			if(isFile(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOTDIR, _path);
			else if(!isDir(current[path[i]]))
				current[path[i]] = {"":true};
			current = current[path[i]];
		}
		return;
	}

	mkdirSync(_path) {
		const path = pathToArray(_path);
		if(path.length === 0) return;
		let current = this.data;
		let i = 0;
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
			current = current[path[i]];
		}
		if(isDir(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.EEXIST, _path);
		else if(isFile(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.ENOTDIR, _path);
		current[path[i]] = {"":true};
		return;
	}

	_remove(_path, name, testFn) {
		const path = pathToArray(_path);
		if(path.length === 0) {
			throw new MemoryFileSystemError(errors.code.EPERM, _path);
		}
		let current = this.data;
		let i = 0;
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
			current = current[path[i]];
		}
		if(!testFn(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.ENOENT, _path);
		delete current[path[i]];
		return;
	}

	rmdirSync(_path) {
		return this._remove(_path, "Directory", isDir);
	}

	unlinkSync(_path) {
		return this._remove(_path, "File", isFile);
	}

	readlinkSync(_path) {
		throw new MemoryFileSystemError(errors.code.ENOSYS, _path);
	}

	writeFileSync(_path, content, encoding) {
		if(!content && !encoding) throw new Error("No content");
		const path = pathToArray(_path);
		if(path.length === 0) {
			throw new MemoryFileSystemError(errors.code.EISDIR, _path);
		}
		let current = this.data;
		let i = 0
		for(; i < path.length - 1; i++) {
			if(!isDir(current[path[i]]))
				throw new MemoryFileSystemError(errors.code.ENOENT, _path);
			current = current[path[i]];
		}
		if(isDir(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.EISDIR, _path);
		current[path[i]] = encoding || typeof content === "string" ? new Buffer(content, encoding) : content;
		return;
	}

	// stream methods
	createReadStream(path, options) {
		let stream = new ReadableStream();
		let done = false;
		let data;
		try {
			data = this.readFileSync(path);
		} catch (e) {
			stream._read = function() {
				if (done) {
					return;
				}
				done = true;
				this.emit('error', e);
				this.push(null);
			};
			return stream;
		}
		options = options || { };
		options.start = options.start || 0;
		options.end = options.end || data.length;
		stream._read = function() {
			if (done) {
				return;
			}
			done = true;
			this.push(data.slice(options.start, options.end));
			this.push(null);
		};
		return stream;
	}

	createWriteStream(path) {
		let stream = new WritableStream();
		try {
			// Zero the file and make sure it is writable
			this.writeFileSync(path, new Buffer(0));
		} catch(e) {
			// This or setImmediate?
			stream.once('prefinish', function() {
				stream.emit('error', e);
			});
			return stream;
		}
		let bl = [ ], len = 0;
		stream._write = (chunk, encoding, callback) => {
			bl.push(chunk);
			len += chunk.length;
			this.writeFile(path, Buffer.concat(bl, len), callback);
		}
		return stream;
	}

	// async functions
	exists(path, callback) {
		return callback(this.existsSync(path));
	}

	writeFile(path, content, encoding, callback) {
		if(!callback) {
			callback = encoding;
			encoding = undefined;
		}
		try {
			this.writeFileSync(path, content, encoding);
		} catch(e) {
			return callback(e);
		}
		return callback();
	}
}

// async functions

["stat", "readdir", "mkdirp", "rmdir", "unlink", "readlink"].forEach(function(fn) {
	MemoryFileSystem.prototype[fn] = function(path, callback) {
		let result;
		try {
			result = this[fn + "Sync"](path);
		} catch(e) {
			setImmediate(function() {
				callback(e);
			});

			return;
		}
		setImmediate(function() {
			callback(null, result);
		});
	};
});

["mkdir", "readFile"].forEach(function(fn) {
	MemoryFileSystem.prototype[fn] = function(path, optArg, callback) {
		if(!callback) {
			callback = optArg;
			optArg = undefined;
		}
		let result;
		try {
			result = this[fn + "Sync"](path, optArg);
		} catch(e) {
			setImmediate(function() {
				callback(e);
			});

			return;
		}
		setImmediate(function() {
			callback(null, result);
		});
	};
});

module.exports = MemoryFileSystem;
