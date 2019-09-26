const AWS = require('aws-sdk')
const fs = require('fs').promises
const path = require('path')
const util = require('util')

const s3 = new AWS.S3({
  apiVersion: '2019-10-01',
  region: 'ap-northeast-1',
})

module.exports = {
  download: async (options, dirs) => {
    const dest = dirs.input + '/' + path.basename(options.key)
    
    console.log('Downloading from S3: ' + options.key + ' -> ' + dest)
    const params = {
      Bucket: options.bucket,
      Key: options.key,
    }
    const output = require('fs').createWriteStream(dest)
    const input = s3.getObject(params).createReadStream()

    return new Promise((resolve) => {
      input.pipe(output)
      input.on('end', () => {
        output.end()
        resolve()
      })
    })
  },

  upload: async (options, dirs) => {
    const tasks = []
    const files = await fs.readdir(dirs.output)
    for (file of files) {
      const key = options.prefix + file
      const src = dirs.output + '/' + file
      console.log('Uploading to S3: ' + src + ' -> ' + key)
      params = {
        Body: await fs.readFile(src),
        Bucket: options.bucket,
        Key: key,
      }
      tasks.push(s3.putObject(params).promise())
    }
    
    return await Promise.all(tasks)
  }
}
