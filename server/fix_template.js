const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'templates', 'booking-confirmation.ejs');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    console.log("Original content length:", content.length);

    // Check if the error exists
    if (content.includes("toLocaleString(' en-IN')")) {
        console.log("Found the error string. Replacing...");
        content = content.replace("toLocaleString(' en-IN')", "toLocaleString('en-IN')");
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("File written successfully.");
        console.log("New content length:", content.length);
    } else {
        console.log("Error string NOT found in file.");
    }

    // Verify
    const newContent = fs.readFileSync(filePath, 'utf8');
    if (newContent.includes("toLocaleString(' en-IN')")) {
        console.error("FAILED to replace string.");
    } else {
        console.log("SUCCESS: String replaced.");
    }

} catch (err) {
    console.error("Error processing file:", err);
}
