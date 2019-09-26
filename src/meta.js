const ffmpeg_command = require('fluent-ffmpeg')

// set FFMPEG_PATH, FFPROBE_PATH as full path

const meta = async (files) => {
    let ffmpeg = ffmpeg_command()
    let tasks = []
    for (let file of files) {
      let ffprobe = new Promise((resolve, reject) => {
        ffmpeg
          .input(file)
          .ffprobe((err, data) => {
            if (err) {
              reject(err)
            } else {
              resolve(data)
            }
          })
      })
      tasks.push(ffprobe)
    }

    return Promise.all(tasks)
}

module.exports = meta
