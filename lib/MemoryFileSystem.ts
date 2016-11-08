/*
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Tobias Koppers @sokra
 */

import normalize = require('./normalize')

import errors = require('errno')
import stream = require('readable-stream')

const ReadableStream: NodeJS.ReadableStream = stream.Readable
const WritableStream: NodeJS.WritableStream = stream.Writable

class MemoryFileSystemError extends Error {
    code: number
    errno: number
    path: string

    constructor(err, path: string) {
        super()
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MemoryFileSystemError)
        }
        this.code = err.code
        this.errno = err.errno
        this.message = err.description
        this.path = path
    }
}

class MemoryFileSystem {
    constructor(public data: any = {}) {
    }

    meta(_path: string) {
        const path = pathToArray(_path)
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                return
            }
            current = current[path[i]]
        }
        return current[path[i]]
    }

    existsSync(_path: string) {
        return !!this.meta(_path)
    }

    statSync(_path: string) {
        const current = this.meta(_path)
        if (_path === '/' || isDir(current)) {
            return {
                isFile: falseFn,
                isDirectory: trueFn,
                isBlockDevice: falseFn,
                isCharacterDevice: falseFn,
                isSymbolicLink: falseFn,
                isFIFO: falseFn,
                isSocket: falseFn
            }
        }
        else if (isFile(current)) {
            return {
                isFile: trueFn,
                isDirectory: falseFn,
                isBlockDevice: falseFn,
                isCharacterDevice: falseFn,
                isSymbolicLink: falseFn,
                isFIFO: falseFn,
                isSocket: falseFn
            }
        }
        else {
            throw new MemoryFileSystemError(errors.code.ENOENT, _path)
        }
    }

    readFileSync(_path: string, encoding?: string) {
        const path = pathToArray(_path)
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
            current = current[path[i]]
        }
        if (!isFile(current[path[i]])) {
            if (isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.EISDIR, _path)
            }
            else {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
        }
        current = current[path[i]]
        return encoding ? current.toString(encoding) : current
    }

    readdirSync(_path: string) {
        if (_path === '/') {
            return Object.keys(this.data).filter(Boolean)
        }
        const path = pathToArray(_path)
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
            current = current[path[i]]
        }
        if (!isDir(current[path[i]])) {
            if (isFile(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOTDIR, _path)
            }
            else {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
        }
        return Object.keys(current[path[i]]).filter(Boolean)
    }

    mkdirpSync(_path: string) {
        const path = pathToArray(_path)
        if (path.length === 0) {
            return
        }
        let current = this.data
        for (let i = 0; i < path.length; i++) {
            if (isFile(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOTDIR, _path)
            }
            else if (!isDir(current[path[i]])) {
                current[path[i]] = { '': true }
            }
            current = current[path[i]]
        }
        return
    }

    mkdirSync(_path: string) {
        const path = pathToArray(_path)
        if (path.length === 0) {
            return
        }
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
            current = current[path[i]]
        }
        if (isDir(current[path[i]])) {
            throw new MemoryFileSystemError(errors.code.EEXIST, _path)
        }
        else if (isFile(current[path[i]])) {
            throw new MemoryFileSystemError(errors.code.ENOTDIR, _path)
        }
        current[path[i]] = { '': true }
        return
    }

    _remove(_path: string, name: string, testFn: ((part: string) => boolean)) {
        const path = pathToArray(_path)
        if (path.length === 0) {
            throw new MemoryFileSystemError(errors.code.EPERM, _path)
        }
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
            current = current[path[i]]
        }
        if (!testFn(current[path[i]])) {
            throw new MemoryFileSystemError(errors.code.ENOENT, _path)
        }
        delete current[path[i]]
        return
    }

    rmdirSync(_path: string) {
        return this._remove(_path, 'Directory', isDir)
    }

    unlinkSync(_path: string) {
        return this._remove(_path, 'File', isFile)
    }

    readlinkSync(_path: string) {
        throw new MemoryFileSystemError(errors.code.ENOSYS, _path)
    }

    writeFileSync(_path: string, content: string | Buffer, encoding?: string) {
        if (!content && !encoding) {
            throw new Error('No content')
        }
        const path = pathToArray(_path)
        if (path.length === 0) {
            throw new MemoryFileSystemError(errors.code.EISDIR, _path)
        }
        let current = this.data
        let i = 0
        for (; i < path.length - 1; i++) {
            if (!isDir(current[path[i]])) {
                throw new MemoryFileSystemError(errors.code.ENOENT, _path)
            }
            current = current[path[i]]
        }
        if (isDir(current[path[i]])) {
            throw new MemoryFileSystemError(errors.code.EISDIR, _path)
        }
        current[path[i]] = encoding || typeof content === 'string' ? new Buffer(<string>content, encoding) : content
        return
    }

    // stream functions

    createReadStream(
        path: string, options: {
            start: number
            end: number
        }
    ) {
        const stream = new ReadableStream()
        let done = false
        let data
        try {
            data = this.readFileSync(path)
        } catch (e) {
            stream._read = function () {
                if (done) {
                    return
                }
                done = true
                this.emit('error', e)
                this.push(null)
            }
            return stream
        }
        options = options || {}
        options.start = options.start || 0
        options.end = options.end || data.length
        stream._read = function () {
            if (done) {
                return
            }
            done = true
            this.push(data.slice(options.start, options.end))
            this.push(null)
        }
        return stream
    }

    createWriteStream(path: string, options) {
        const stream = new WritableStream()
        const self = this
        try {
            // Zero the file and make sure it is writable
            this.writeFileSync(path, new Buffer(0))
        } catch (e) {
            // This or setImmediate?
            stream.once('prefinish', () => {
                stream.emit('error', e)
            })
            return stream
        }
        const bl: Buffer[] = []
        let len = 0
        stream._write = function (chunk, encoding, callback) {
            bl.push(chunk)
            len += chunk.length
            self.writeFile(path, Buffer.concat(bl, len), callback)
        }
        return stream
    }

    exists(path: string, callback: (isExist: boolean) => any) {
        return callback(this.existsSync(path))
    }

    writeFile(path: string, content: string, encoding: any, callback?: (err?: Error) => any) {
        if (!callback) {
            callback = encoding
            encoding = undefined
        }

        try {
            this.writeFileSync(path, content, encoding)
        } catch (e) {
            return (<Function>callback)(e as Error)
        }
        return (<Function>callback)()
    }
}

export = MemoryFileSystem

function isDir(item: {}) {
    if (typeof item !== 'object') {
        return false
    }
    return item[''] === true
}

function isFile(item: {}) {
    if (typeof item !== 'object') {
        return false
    }
    return !item['']
}

function pathToArray(path: string) {
    let normalizedPath
    path = normalize(path)
    const nix = /^\//.test(path)
    if (!nix) {
        if (!/^[A-Za-z]:/.test(path)) {
            throw new MemoryFileSystemError(errors.code.EINVAL, path)
        }
        path = path.replace(/[\\\/]+/g, '\\') // multi slashs
        normalizedPath = path.split(/[\\\/]/)
        normalizedPath[0] = normalizedPath[0].toUpperCase()
    }
    else {
        path = path.replace(/\/+/g, '/') // multi slashs
        normalizedPath = path.substr(1).split('/')
    }
    if (!normalizedPath[normalizedPath.length - 1]) {
        normalizedPath.pop()
    }
    return normalizedPath
}

function trueFn() {
    return true
}

function falseFn() {
    return false
}

interface MemoryFileSystem {
    writeFile(path: string, content: string | Buffer, callback: (err?: Error) => any)
    writeFile(path: string, content: string | Buffer, encoding: string, callback: (err?: Error) => any)
    join(path: string, request: string): string
    pathToArray(path: string): string[]
    normalize(path: string): string
    stat(path: string, callback: (err?: Error, result?: any) => any): void
    readdir(path: string, callback: (err?: Error, result?: any) => any): void
    mkdirp(path: string, callback: (err?: Error, result?: any) => any): void
    rmdir(path: string, callback: (err?: Error, result?: any) => any): void
    unlink(path: string, callback: (err?: Error, result?: any) => any): void
    readlink(path: string, callback: (err?: Error, result?: any) => any): void
    mkdir(path: string, optArg: {}, callback: (err?: Error, result?: any) => any): void
    readFile(path: string, optArg: {}, callback: (err?: Error, result?: any) => any): void
}

MemoryFileSystem.prototype.join = require('./join')
MemoryFileSystem.prototype.pathToArray = pathToArray
MemoryFileSystem.prototype.normalize = normalize

// async functions
const async = ['stat', 'readdir', 'mkdirp', 'rmdir', 'unlink', 'readlink']
async.forEach(fn => {
    MemoryFileSystem.prototype[fn] = function (path: string, callback) {
        let result
        try {
            result = this[`${fn}Sync`](path)
        } catch (e) {
            setImmediate(() => {
                callback(e)
            })

            return
        }
        setImmediate(() => {
            callback(null, result)
        })
    }
})

const async2 = ['mkdir', 'readFile']
async2.forEach(fn => {
    MemoryFileSystem.prototype[fn] = function (path: string, optArg, callback) {
        if (!callback) {
            callback = optArg
            optArg = undefined
        }
        let result
        try {
            result = this[`${fn}Sync`](path, optArg)
        } catch (e) {
            setImmediate(() => {
                callback(e)
            })

            return
        }
        setImmediate(() => {
            callback(null, result)
        })
    }
})
