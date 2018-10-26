const MemoryFileSystem = require('./lib/MemoryFileSystem');
const fs = new MemoryFileSystem();
fs.mkdirpSync('/a/b/c');
debugger;
fs.rmdirSync('/a');
console.log(fs.readdirSync('/b'))
process.exit(1)