"use strict"

const join = require("./join");

module.exports = function transformData(data, json = {}, parentPathname = '') {
  const paths = Object.keys(data)
  paths.forEach((path) => {
    const pathData = data[path]
    const isRoot = pathData === true
    if (isRoot) {
      return
    }
    const isDir = pathData[""] === true
    const hasFiles = isDir && Object.keys(pathData).length > 1
    const isFile = !isDir && pathData !== undefined
    const pathname = join(parentPathname, path)
    if (hasFiles) {
      transformData(pathData, json, pathname)
    } else if (isFile) {
      json[pathname] = pathData.toString()
    } else if (isDir) {
      json[pathname] = null
    }
  })
  return json
};
