const ejs = require("ejs");
const path = require("path");

// CONSTANTS
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Helper: safe fetch wrapper
const sendToBrevo = async (payload) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        throw new Error("Missing BREVO_API_KEY in environment variables");
    }

    const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": apiKey,
            "content-type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
};

/**
 * Validate Email Address Format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email) return false;
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
};

/**
 * Send Booking Confirmation Email via Brevo
 * @param {Object} bookingData - The booking details
 */
const sendBookingEmail = async (bookingData) => {
    let recipientEmail = "info@wayanadfort.com"; // Default receiver
    // Optional: Allow overriding via env (though requirement says configurable string variable, likely meaning hardcoded here or Env)
    // We'll stick to fixed string or env if present to be safe
    if (process.env.RESORT_NOTIFICATION_EMAIL) {
        recipientEmail = process.env.RESORT_NOTIFICATION_EMAIL;
    }

    // Sender details
    // Requirement: Sender name: "Wayanad Fort Resort"
    // Requirement: Sender email: configurable
    // We use RESORT_EMAIL as the 'From' address.
    const senderEmail = process.env.RESORT_EMAIL;

    try {
        // 1. Validation
        if (!senderEmail) {
            console.warn("⚠️ SKIPPING EMAIL: Missing RESORT_EMAIL environment variable.");
            return null;
        }

        console.log(`📨 Preparing to send booking email to: '${recipientEmail}' via Brevo`);

        // Render Template
        const templatePath = path.join(__dirname, "../templates/booking-email.ejs");
        const emailHtml = await ejs.renderFile(templatePath, bookingData);

        // 2. Prepare Payload
        const payload = {
            sender: {
                name: "Wayanad Fort Resort",
                email: senderEmail
            },
            to: [
                {
                    email: recipientEmail,
                    name: "Resort Admin"
                }
            ],
            subject: `New Booking Confirmed: ${bookingData.bookingId} - ${bookingData.guestName}`,
            htmlContent: emailHtml
        };

        // 3. Send
        const result = await sendToBrevo(payload);
        console.log("✅ Booking email sent successfully via Brevo:", result.messageId);
        return result;

    } catch (error) {
        // Non-blocking error handling
        console.error("❌ Email sending failed (Brevo):");
        console.error("   Message:", error.message);
        // We do not throw, so booking flow proceeds
    }
};

/**
 * Send Test Email (Brevo)
 * @returns {Promise<Object>}
 */
const sendTestEmail = async (customRecipient) => {
    const senderEmail = process.env.RESORT_EMAIL;
    if (!senderEmail) throw new Error("RESORT_EMAIL env var missing");

    const recipient = customRecipient || senderEmail;

    // Simple HTML content for test
    const htmlContent = `
        <html>
        <body>
            <h1>Test Email from Resort Server (Brevo API)</h1>
            <p>This is a test email triggered from the <code>/api/test-email</code> endpoint.</p>
            <ul>
                <li><strong>Source:</strong> Brevo REST API</li>
                <li><strong>Sender:</strong> ${senderEmail}</li>
                <li><strong>Recipient:</strong> ${recipient}</li>
                <li><strong>Time:</strong> ${new Date().toISOString()}</li>
            </ul>
            <p style="color: green; font-weight: bold;">If you see this, email integration is WORKING!</p>
        </body>
        </html>
    `;

    const payload = {
        sender: {
            name: "Wayanad Fort Resort Debug",
            email: senderEmail
        },
        to: [
            {
                email: recipient,
                name: "Test User"
            }
        ],
        subject: "Test Email from Brevo API",
        htmlContent: htmlContent
    };

    return await sendToBrevo(payload);
};

module.exports = { sendBookingEmail, sendTestEmail };
