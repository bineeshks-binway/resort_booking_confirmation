
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'templates', 'booking-confirmation.ejs');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("' en-IN'")) {
        console.log('Found incorrect locale string. Fixing...');
        const newContent = content.replace(/' en-IN'/g, "'en-IN'");
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('File updated successfully.');
    } else {
        console.log('Incorrect locale string not found.');
    }
} catch (err) {
    console.error('Error updating file:', err);
}
