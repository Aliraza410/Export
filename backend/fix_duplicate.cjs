const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const dashStr = "// --- DASHBOARD ---";
const firstDash = content.indexOf(dashStr);
const secondDash = content.indexOf(dashStr, firstDash + 1);

if (secondDash !== -1) {
  // It got duplicated! Truncate at the second occurrence of the dashboard route, which was inserted inside the first insights catch block!
  // Wait, let's just find the first "app.listen(PORT"
  const listenStr = "app.listen(PORT";
  const firstListen = content.indexOf(listenStr);
  
  // Cut the file after the end of app.listen block
  const endBlock = content.indexOf("});", firstListen);
  
  if (endBlock !== -1) {
    content = content.substring(0, endBlock + 3) + "\n";
    fs.writeFileSync('server.js', content);
    console.log("Truncated extra corrupted lines.");
  }
} else {
  console.log("No duplicate found, maybe fixing manually.");
}
