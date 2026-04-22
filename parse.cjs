const fs = require('fs');

const tsContent = fs.readFileSync('./src/lib/initialData.ts', 'utf8');
const jsonStrRaw = tsContent.substring(tsContent.indexOf('{'), tsContent.lastIndexOf('}') + 1);

try {
  const d = JSON.parse(jsonStrRaw);
  console.log(JSON.stringify(d.matches[2], null, 2));
} catch (e) {
  console.log("JSON parse error:", e.message);
}
