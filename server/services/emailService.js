const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// Create Transporter
// Using a single transporter instance for efficiency
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.RESORT_EMAIL,
        pass: process.env.RESORT_EMAIL_APP_PASSWORD,
    },
});

/**
 * Validate Email Address Format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email) return false;
    // Standard regex for email validation
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
};

/**
 * Send Booking Confirmation Email
 * @param {Object} bookingData - The booking details
 */
const sendBookingEmail = async (bookingData) => {
    try {
        // 1. SANITIZATION & VALIDATION
        // Determine the recipient email.
        // Ideally this should be passed in bookingData or config, 
        // but the requirement says "Set email recipient (TO) as: bineeshbinees518@gmail.com"
        // We will validate this hardcoded email too to be safe.
        let recipientEmail = "bineeshbineesh518@gmail.com";

        // Sanitize: Trim whitespace
        if (recipientEmail) {
            recipientEmail = recipientEmail.trim();
        }

        console.log(`📨 Preparing to send booking email to: '${recipientEmail}'`);

        // Validate: Check format
        if (!isValidEmail(recipientEmail)) {
            console.warn(`⚠️ SKIPPING EMAIL: Invalid recipient email address format: '${recipientEmail}'`);
            return null; // Gracefully return without erroring
        }

        const senderEmail = process.env.RESORT_EMAIL;
        if (!senderEmail) {
            console.warn("⚠️ SKIPPING EMAIL: Missing RESORT_EMAIL environment variable.");
            return null;
        }

        // 2. TEMPLATE RENDERING
        const templatePath = path.join(__dirname, "../templates/booking-email.ejs");
        const emailHtml = await ejs.renderFile(templatePath, bookingData);

        // 3. SEND EMAIL
        const mailOptions = {
            from: `"Wayanad Fort Resort" <${senderEmail}>`,
            to: recipientEmail,
            subject: `New Booking Confirmed: ${bookingData.bookingId} - ${bookingData.guestName}`,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Booking email sent successfully:", info.messageId);
        return info;

    } catch (error) {
        // 4. ERROR HANDLING
        // Log the full error but do not throw, ensuring booking flow continues
        console.error("❌ Email sending failed:", error.message);
        if (error.response) {
            console.error("🔍 SMTP Response:", error.response);
        }
    }
};

module.exports = { sendBookingEmail };
