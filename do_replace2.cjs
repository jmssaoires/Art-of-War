const fs = require('fs');

let file = 'src/components/GddBuilder.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/白莲传讲教化/g, '三教名师讲法');
data = data.replace(/佛、白莲/g, '佛教教门');

fs.writeFileSync(file, data);
console.log('Replacements complete.');
