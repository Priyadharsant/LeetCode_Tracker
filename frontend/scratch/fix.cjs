const fs = require('fs');
let code = fs.readFileSync('C:/LeetCode_Tracker/frontend/src/pages/Dashboard.jsx', 'utf8');

const levelDetailsRegex = /(\s*{\/\* Level Master Detailed Section \*\/}.*?)(?=\s*<\/div>\s*<\/div>\s*\);\s*})/s;
const match = code.match(levelDetailsRegex);

if (match) {
    const levelDetailsBlock = match[1];
    code = code.replace(levelDetailsRegex, '');
    
    code = code.replace(
        /<Heatmap data={solvedDates} days={365} \/>\s*<\/div>/s,
        '<Heatmap data={solvedDates} days={365} />\n' + levelDetailsBlock + '\n        </div>'
    );
    
    code = code.replace(/<div className="mt-16">/, '<div className="mt-8">');
    
    fs.writeFileSync('C:/LeetCode_Tracker/frontend/src/pages/Dashboard.jsx', code);
    console.log('Successfully restructured Dashboard.jsx');
} else {
    console.log('Failed to match Level Details block');
}
