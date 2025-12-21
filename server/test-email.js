const { sendTestEmail } = require('./services/emailService');
require('dotenv').config();

async function runTest() {
    console.log("🔍 Checking Environment Variables...");
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error("❌ BREVO_API_KEY is missing");
        return;
    }
    console.log(`✅ BREVO_API_KEY found: ${apiKey.substring(0, 10)}...`);

    console.log("\n📧 Sending Test Email via Brevo...");
    try {
        const info = await sendTestEmail(); // Sends to RESORT_EMAIL by default
        console.log("✅ Test Email Sent Successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Sending Email Failed:", error.message);
    }
}

runTest();
