"use strict"

const join = require("./join");

module.exports = function transformData(data, memfsData = {}, parentPathname = '/') {
  const paths = Object.keys(data)
  paths.forEach((path) => {
    const pathData = data[path]
    const isRoot = pathData === true
    const isDir = pathData[""] === true
    const pathname = join(parentPathname, path)
    if (isDir) {
      transformData(pathData, memfsData, pathname)
    } else if (!isRoot && pathData) {
      memfsData[pathname] = pathData.toString()
    }
  })
  return memfsData
};
