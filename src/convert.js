const util = require('util')
const fs = require('fs')
const path = require('path')
const working_dir = require('./working_dir')
const child_process = require('child_process')
const s3 = require('./s3')
const client_callback = require('./client_callback')
const meta = require('./meta')

const copyFileAsync = util.promisify(fs.copyFile)

collect_input = async (dirs, command) => {
  const tasks = []
  for (file of command.input.files) {
    tasks.push(s3.download(file.s3, dirs))
  }

  await Promise.all(tasks)
}

upload_output = async (dirs, command) => {
  console.log(command)
  await s3.upload(command.upload.s3, dirs)
}

const collect_files = (dirs, files) => {
  return files.map(file => dirs.input + '/' + path.basename(file.s3.key))
}

ffmpeg = async (dirs, files, args = []) => {
  let file_options = files.map(f => ['-i', f])
  const input_files = Array.prototype.concat.apply([], file_options);
  const ffmpeg_args = ['-y'].concat(input_files.concat(args))
  console.log(ffmpeg_args)

  return new Promise((resolve)=> {
    const proc = child_process.spawn('/var/task/bin/ffmpeg', ffmpeg_args, {
      cwd: dirs.output, // 出力先フォルダで作業する
    })

    proc.stderr.on('data', (chunk) => {
      console.log(chunk.toString())
    })

    proc.on('exit', (code) => {
      resolve(proc, code)
    })
  })
}

send_callback = async (options, metas) => {
  await client_callback.send(options, metas)
}

cleanup = async (dirs) => {
  console.log('cleanup')
  await working_dir.clean(dirs)
  return true
}

const run_input_cmd = async (input, dirs) => {
  // FIXME `input` コマンドは先頭(index:0)固定として扱う
  for (let command of input.commands) {
    if (command.type === 'input') {
      await collect_input(dirs, command)
    }
  }
  return collect_files(dirs, input.commands[0].input.files)
}

const run_upload_cmd = async (input, dirs) => {
  for (let command of input.commands) {
    if (command.type === 'upload') {
      await upload_output(dirs, command)
    }
  }
}

transcode = async (input, dirs, files) => {
  for (let command of input.commands) {
    if (command.type === 'ffmpeg') {
      let [_, metas] = await Promise.all([
        ffmpeg(dirs, files, command.ffmpeg.options),
      ])
    }
  }
}

convert = async(input) => {
  const dirs = await working_dir.mkdirs()

  // files => [ファイルのフルパス]
  let files = await run_input_cmd(input, dirs)

  let [_, metas] = await Promise.all([
    transcode(input, dirs, files),
    meta(files)
  ])

  await run_upload_cmd(input, dirs)

  //cleanup(dirs)
  console.log(metas)
  await send_callback(input.callback, metas)
}

module.exports = convert

