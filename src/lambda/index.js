'use strict';

const convert = require('../convert')

exports.handler = async (event, context, callback) => {
  await convert(event)
  callback()
};
