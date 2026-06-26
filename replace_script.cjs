const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace 1fr 1fr
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr",?\s*/g, '<div className="grid-2" style={{ ');
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr"\s*\}\}/g, '<div className="grid-2">');

// Replace 2fr 1fr
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"2fr 1fr",?\s*/g, '<div className="grid-2-1" style={{ ');
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"2fr 1fr"\s*\}\}/g, '<div className="grid-2-1">');

// Replace 3fr 2fr
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"3fr 2fr",?\s*/g, '<div className="grid-3-2" style={{ ');
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"3fr 2fr"\s*\}\}/g, '<div className="grid-3-2">');

// Replace repeat(4, 1fr)
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"repeat\\(4, 1fr\\)",?\s*/g, '<div className="grid-4" style={{ ');
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"repeat\\(4, 1fr\\)"\s*\}\}/g, '<div className="grid-4">');

// Replace 1fr 300px
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 300px",?\s*/g, '<div className="grid-1-300" style={{ ');
code = code.replace(/<div style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 300px"\s*\}\}/g, '<div className="grid-1-300">');

// For AuthPage which has: <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
code = code.replace(/<div style=\{\{\s*minHeight:\s*"100vh",\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr",\s*/g, '<div className="grid-2" style={{ minHeight: "100vh", ');

fs.writeFileSync('src/App.jsx', code);
console.log('Replaced successfully');
