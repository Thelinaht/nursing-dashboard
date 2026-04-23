const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/hanin/Downloads/nursing-dashboard-main/nursing-dashboard-main/frontend/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('localStorage.getItem("user")')) {
        content = content.replace(/localStorage\.getItem\("user"\)/g, 'sessionStorage.getItem("user")');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});
