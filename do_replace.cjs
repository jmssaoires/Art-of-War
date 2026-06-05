const fs = require('fs');

let file = 'src/components/UprisingCultureSandbox.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/BUDDHIST_SECTARIAN/g, 'BUDDHIST');

data = data.replace(/白莲密教在此扎根引诱/g, '释家禅宗在此广开度牒');
data = data.replace(/📿 白莲起事催化/g, '📿 释门起事催化');
data = data.replace(/📿 白莲设赈缓冲/g, '📿 释家设赈缓冲');
data = data.replace(/白莲大教首借谶言登高抗拒/g, '大和尚步入尘世抗拒');
data = data.replace(/满载白莲教诀/g, '满载佛经谶纬');
data = data.replace(/白莲弥勒/g, '释家佛理');
data = data.replace(/白莲释众/g, '释门僧众');
data = data.replace(/📿 白莲降世/g, '📿 佛门降世');
data = data.replace(/白莲秘教/g, '释门子弟');
data = data.replace(/白莲法会/g, '佛门禅寺');
data = data.replace(/📿 白莲度世/g, '📿 佛门度世');
data = data.replace(/佛家白莲/g, '释家佛门');
data = data.replace(/而白莲教门在严苛征税下/g, '而释家寺院在严苛征税下');
data = data.replace(/白莲大教首授秘密度牒/g, '高僧大德广度流民');
data = data.replace(/📿 白莲救世/g, '📿 释门救世');
data = data.replace(/佛门白莲/g, '释门参禅');
data = data.replace(/白莲释渡/g, '佛门释渡');
data = data.replace(/白莲压制密率/g, '释门压制密率');
data = data.replace(/白莲/g, '佛教');

fs.writeFileSync(file, data);
console.log('Replacements complete.');
