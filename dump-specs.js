'use strict';
// Prints the column layout the tool uses, as JSON. Used by check_headers.py.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\*CORE-START\*\/([\s\S]*?)\/\*CORE-END\*\//);
if (!m) { console.error('CORE markers not found in index.html'); process.exit(1); }
const { SPECS } = new Function(m[1] + '\nreturn {SPECS};')();
console.log(JSON.stringify(SPECS));
