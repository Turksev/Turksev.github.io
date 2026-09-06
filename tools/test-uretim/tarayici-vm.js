'use strict';

// Node's isolated vm context does not inherit these browser-standard UTF-8
// APIs. Supply the real implementations so the production codec runs intact.
var util = require('node:util');
module.exports = function tarayiciAPIleri(baglam) {
  baglam.TextEncoder = util.TextEncoder;
  baglam.TextDecoder = util.TextDecoder;
  return baglam;
};
