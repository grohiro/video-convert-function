const http = require('http')

const send = async (callback, meta) => {
  const options = {
    method: 'post',
  }

  const req = http.request(callback.url, options, (res) => {
    res.on('end', () => {
      console.log('Callback finished')
    })
  })

  const data = {
    params: callback.params,
    meta: meta,
  }
  req.write(JSON.stringify(data))
  req.end()
}

module.exports = {
  send,
}

