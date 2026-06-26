const fs = require('fs');
const path = require('path');

const code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

// Helper to extract lines
const extract = (start, end) => lines.slice(start - 1, end).join('\n') + '\n';

// Create directories
if (!fs.existsSync('src/components')) fs.mkdirSync('src/components');
if (!fs.existsSync('src/pages')) fs.mkdirSync('src/pages');

// Standard imports
const uiImports = `import React from "react";\n`;
const pageImports = `import React, { useState, useEffect } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";\n\n`;

// Components extraction
const components = {
  'Icon.jsx': uiImports + extract(8, 51) + 'export default Icon;\n',
  'Charts.jsx': uiImports + extract(52, 63) + '\n' + extract(64, 81) + 'export { MiniBarChart, DonutChart };\n',
  'ProgressBar.jsx': uiImports + extract(82, 96) + 'export default ProgressBar;\n',
  'Badge.jsx': uiImports + extract(97, 115) + 'export default Badge;\n',
  'StatCard.jsx': uiImports + `import Icon from "./Icon.jsx";\n` + extract(116, 131) + 'export default StatCard;\n',
  'NotifItem.jsx': uiImports + `import Icon from "./Icon.jsx";\n` + extract(132, 144) + 'export default NotifItem;\n',
  'Sidebar.jsx': uiImports + `import Icon from "./Icon.jsx";\n` + extract(470, 522) + 'export default Sidebar;\n',
  'TopBar.jsx': uiImports + `import Icon from "./Icon.jsx";\n` + extract(523, 551) + 'export default TopBar;\n'
};

// Pages extraction
const pages = {
  'LandingPage.jsx': pageImports + extract(145, 380) + 'export default LandingPage;\n',
  'AuthPage.jsx': pageImports + extract(381, 469) + 'export default AuthPage;\n',
  'Dashboard.jsx': pageImports + extract(552, 699) + 'export default Dashboard;\n',
  'ExportGuidance.jsx': pageImports + extract(700, 858) + 'export default ExportGuidance;\n',
  'CostEstimator.jsx': pageImports + extract(859, 991) + 'export default CostEstimator;\n',
  'Documents.jsx': pageImports + extract(992, 1117) + 'export default Documents;\n',
  'CountryInsights.jsx': pageImports + extract(1118, 1216) + 'export default CountryInsights;\n',
  'AdminPanel.jsx': pageImports + extract(1217, 1333) + 'export default AdminPanel;\n'
};

// App.jsx remaining
const newApp = `import React, { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ExportGuidance from "./pages/ExportGuidance.jsx";
import CostEstimator from "./pages/CostEstimator.jsx";
import Documents from "./pages/Documents.jsx";
import CountryInsights from "./pages/CountryInsights.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

` + extract(1335, lines.length);

// Write files
for (const [name, content] of Object.entries(components)) {
  fs.writeFileSync(path.join('src/components', name), content);
}
for (const [name, content] of Object.entries(pages)) {
  fs.writeFileSync(path.join('src/pages', name), content);
}
fs.writeFileSync('src/App.jsx', newApp);

console.log("Refactoring complete!");
