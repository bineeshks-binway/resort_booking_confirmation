require('dotenv').config(); // Looks for .env in current directory by default
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("🔍 Checking Environment Variables...");
    const user = process.env.RESORT_EMAIL;
    const pass = process.env.RESORT_EMAIL_APP_PASSWORD;

    if (!user) console.error("❌ RESORT_EMAIL is missing");
    else console.log(`✅ RESORT_EMAIL found: ${user}`);

    if (!pass) console.error("❌ RESORT_EMAIL_APP_PASSWORD is missing");
    else console.log(`✅ RESORT_EMAIL_APP_PASSWORD found: ${pass ? 'Yes (hidden)' : 'No'}`);

    if (!user || !pass) {
        console.error("🛑 Stopping test due to missing credentials.");
        return;
    }

    console.log("\n🔄 Creating Transporter...");
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
    });

    console.log("🔄 Verifying Connection...");
    try {
        await transporter.verify();
        console.log("✅ Connection Verified Successfully!");
    } catch (error) {
        console.error("❌ Connection Verification Failed:", error.message);
        console.error(error);
        return;
    }

    console.log("\n📧 Sending Test Email...");
    try {
        const info = await transporter.sendMail({
            from: `"Test Script" <${user}>`,
            to: user, // Send to self
            subject: "Test Email from Debug Script",
            text: "If you receive this, the email configuration is correct."
        });
        console.log("✅ Test Email Sent Successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Sending Email Failed:", error.message);
        console.error(error);
    }
}

testEmail();
