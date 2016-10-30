const doubleSlashWinRegExp = /\\+/g
const doubleSlashNixRegExp = /\/+/g
const currentDirectoryWinMiddleRegExp = /\\(\.\\)+/
const currentDirectoryWinEndRegExp = /\\\.$/
const parentDirectoryWinMiddleRegExp = /\\+[^\\]+\\+\.\.\\/
const parentDirectoryWinEndRegExp1 = /([A-Z]:\\)\\*[^\\]+\\+\.\.$/i
const parentDirectoryWinEndRegExp2 = /\\+[^\\]+\\+\.\.$/
const currentDirectoryNixMiddleRegExp = /\/+(\.\/)+/
const currentDirectoryNixEndRegExp1 = /^\/+\.$/
const currentDirectoryNixEndRegExp2 = /\/+\.$/
const parentDirectoryNixMiddleRegExp = /(^|\/[^\/]+)\/+\.\.\/+/
const parentDirectoryNixEndRegExp1 = /^\/[^\/]+\/+\.\.$/
const parentDirectoryNixEndRegExp2 = /\/+[^\/]+\/+\.\.$/
const parentDirectoryNixEndRegExp3 = /^\/+\.\.$/

// RegExp magic :)

export = function normalize(path: string) {
    while (currentDirectoryWinMiddleRegExp.test(path)) path = path.replace(currentDirectoryWinMiddleRegExp, '\\')
    path = path.replace(currentDirectoryWinEndRegExp, '')
    while (parentDirectoryWinMiddleRegExp.test(path)) path = path.replace(parentDirectoryWinMiddleRegExp, '\\')
    path = path.replace(parentDirectoryWinEndRegExp1, '$1')
    path = path.replace(parentDirectoryWinEndRegExp2, '')

    while (currentDirectoryNixMiddleRegExp.test(path)) path = path.replace(currentDirectoryNixMiddleRegExp, '/')
    path = path.replace(currentDirectoryNixEndRegExp1, '/')
    path = path.replace(currentDirectoryNixEndRegExp2, '')
    while (parentDirectoryNixMiddleRegExp.test(path)) path = path.replace(parentDirectoryNixMiddleRegExp, '/')
    path = path.replace(parentDirectoryNixEndRegExp1, '/')
    path = path.replace(parentDirectoryNixEndRegExp2, '')
    path = path.replace(parentDirectoryNixEndRegExp3, '/')

    return path.replace(doubleSlashWinRegExp, '\\').replace(doubleSlashNixRegExp, '/')
}
