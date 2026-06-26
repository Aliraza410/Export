const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/Settings.jsx',
  'src/pages/ExportGuidance.jsx',
  'src/pages/Documents.jsx',
  'src/pages/AdminPanel.jsx',
  'src/components/TopBar.jsx',
  'src/components/Sidebar.jsx',
  'src/api.js'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // In api.js, replace the baseURL
    if (file.endsWith('api.js')) {
      content = content.replace(
        /baseURL:\s*'http:\/\/localhost:5000\/api'/,
        "baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api'"
      );
    } 
    // In all other files, replace the string template parts
    else {
      // Handle the complex template literals: `http://localhost:5000${...}`
      // We will replace `http://localhost:5000` with `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}`
      content = content.replace(
        /`http:\/\/localhost:5000([^`]*)`/g, 
        "`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}$1`"
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
