'use strict';
const assert = require('node:assert/strict');
const {validateRow, expectedPhrases} = require('../kalip-anlam-kaynagi');
const original = [{en:'establish a company',tr:'şirket kurmak'}];
const prior = [...original,{en:'establish the cause',tr:'sebebi belirlemek'}];
const next = [...original,{en:'establish the cause',tr:'nedeni saptamak'}];
const row = {word:'establish',expected_senses:['kurmak; saptamak'],expected:original,
  previous_replacement:prior,replacement:next,sense_coverage:[[0],[0]]};
validateRow(row);
const rows = new Map([['establish',row]]), card = kl => ({a:[{tr:'kurmak; saptamak'}],kl});
assert.deepEqual(expectedPhrases('establish',card(original),rows),next,'Legacy generator source remains unchanged');
assert.deepEqual(expectedPhrases('establish',card(prior),rows,true),next,'An explicit editorial revision can be applied');
assert.deepEqual(expectedPhrases('establish',card(next),rows,true),next,'Reapplication is idempotent');
assert.throws(()=>expectedPhrases('establish',card(prior),rows),/phrase guard/,'Published transition cannot replace the legacy guard');
assert.throws(()=>expectedPhrases('establish',card([{en:'other text',tr:'başka metin'}]),rows,true),/phrase guard/,'Unknown runtime data is rejected');
assert.throws(()=>validateRow({...row,previous_replacement:[{en:'',tr:'eksik'}]}),/plain text/,'Transition is validated too');
console.log('Explicit editorial transitions preserve canonical guards and reject unknown runtime edits');
