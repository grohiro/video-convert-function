const fs = require('fs')
const tmp = require('tmp-promise') // https://github.com/benjamingr/tmp-promise
const util = require('util')
const rimraf = require('rimraf')

const mkdirAsync = util.promisify(fs.mkdir)

module.exports = {
  mkdirs: async () => {
    const tmpdir = await tmp.dir(/*{unsafeCleanup: true}*/)
    const input_dir = tmpdir.path + '/input'
    const output_dir = tmpdir.path + '/output'

    await mkdirAsync(input_dir)
    await mkdirAsync(output_dir)

    return {
      root: tmpdir.path,
      input: input_dir,
      output: output_dir,
    }
  },
  clean: (dirs) => {
    return new Promise((resolve) => {
      if (dirs && dirs.root) {
        rimraf(dirs.root, {}, () => {
          resolve()
        })
      }
    })
  }
}
