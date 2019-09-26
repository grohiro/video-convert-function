const meta = require('../../src/meta')

meta([__dirname + '/preview.mp4', __dirname + '/sample.mp4']).then((info) => {
  console.log(JSON.stringify(info, null, " "))
})
