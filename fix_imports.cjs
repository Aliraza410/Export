const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const files = fs.readdirSync(pagesDir);

files.forEach(file => {
  if (['Dashboard.jsx', 'ExportGuidance.jsx', 'CostEstimator.jsx', 'Documents.jsx', 'CountryInsights.jsx', 'AdminPanel.jsx'].includes(file)) {
    let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    if (!content.includes('import Sidebar')) {
      content = content.replace('import NotifItem from "../components/NotifItem.jsx";', 
        'import NotifItem from "../components/NotifItem.jsx";\nimport Sidebar from "../components/Sidebar.jsx";\nimport TopBar from "../components/TopBar.jsx";'
      );
      fs.writeFileSync(path.join(pagesDir, file), content);
      console.log('Fixed', file);
    }
  }
});
