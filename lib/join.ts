import normalize = require('./normalize')

const absoluteWinRegExp = /^[A-Z]:([\\\/]|$)/i
const absoluteNixRegExp = /^\//i

export = function join(path: string, request: string) {
    if (!request) {
        return normalize(path)
    }
    if (absoluteWinRegExp.test(request)) {
        return normalize(request.replace(/\//g, '\\'))
    }
    if (absoluteNixRegExp.test(request)) {
        return normalize(request)
    }
    if (path === '/') {
        return normalize(path + request)
    }
    if (absoluteWinRegExp.test(path)) {
        return normalize(`${path.replace(/\//g, '\\')}\\${request.replace(/\//g, '\\')}`)
    }
    if (absoluteNixRegExp.test(path)) {
        return normalize(`${path}/${request}`)
    }
    return normalize(`${path}/${request}`)
}
