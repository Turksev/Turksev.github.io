'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
let failed = 0, total = 0;
for (const file of fs.readdirSync(__dirname).filter(f=>f.endsWith('-test.js')).sort()) {
  total++;
  const result = cp.spawnSync(process.execPath, [path.join(__dirname,file)], {encoding:'utf8'});
  if (result.status !== 0) {failed++; console.error(file+'\n'+result.stdout+result.stderr);}
  else console.log('OK '+file);
}
console.log(`${total-failed}/${total} test geçti`);
process.exitCode = failed ? 1 : 0;
