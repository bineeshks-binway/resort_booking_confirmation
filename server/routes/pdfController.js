const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const QRCode = require("qrcode");
const fs = require("fs");

// ✅ OPTIMIZATION: Reuse Browser Instance
let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance) {
    console.log("🚀 Launching new Puppeteer browser instance...");
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Optimize memory
        "--disable-gpu"
      ]
    });

    // Handle crashes/disconnects
    browserInstance.on("disconnected", () => {
      console.log("⚠️ Browser disconnected! Resetting instance...");
      browserInstance = null;
    });
  }
  return browserInstance;
};

const getImageAsBase64 = (filePath) => {
  try {
    const fullPath = path.join(__dirname, "../public/images", filePath);
    if (fs.existsSync(fullPath)) {
      const bitmap = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).substring(1);
      return `data:image/${ext};base64,${bitmap.toString("base64")}`;
    }
  } catch (err) {
    console.error("Error loading image:", filePath, err);
  }
  return "";
};

router.post("/generate-pdf", async (req, res) => {
  let page = null;
  try {
    const {
      guestName,
      phoneNumber,
      checkIn,
      checkOut,
      guests,
      roomType,
      price,
      paymentStatus,
      extraServices,
      specialNotes,
      bookingId
    } = req.body;

    console.log(`📄 Generating PDF for: ${guestName} (${bookingId})`);

    // ✅ QR Code
    const locationUrl = "https://www.google.com/maps/search/?api=1&query=Wayanad+Green+Valley+Resort";
    const qrCodeData = await QRCode.toDataURL(locationUrl);

    // ✅ LOGO & IMAGES
    const logoData = getImageAsBase64("logo.jpg");
    const roomImageData = getImageAsBase64("room.webp");

    // ✅ Data passed to EJS
    const data = {
      guestName,
      phoneNumber,
      checkIn,
      checkOut,
      guests,
      roomType,
      price,
      paymentStatus,
      extraServices: extraServices || [],
      specialNotes,
      bookingId: bookingId || `RES-${Date.now()}`,
      qrCodeData,
      logoData,
      roomImageData
    };

    // ✅ Template path
    const templatePath = path.join(__dirname, "../templates/booking-confirmation.ejs");

    // ✅ Render EJS to HTML
    const html = await ejs.renderFile(templatePath, data);

    // ✅ Get Browser & New Page
    const browser = await getBrowser();
    page = await browser.newPage();

    // ✅ Set Content & Wait
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.waitForSelector("img");

    // ✅ Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    console.log("✅ PDF Generated successfully");

    // ✅ Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking_${guestName}.pdf"`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ PDF Generation Error:", error);
    // If browser crashed, reset it
    if (error.message.includes('Protocol error') || error.message.includes('Target closed')) {
      if (browserInstance) {
        await browserInstance.close().catch(() => { });
        browserInstance = null;
      }
    }
    res.status(500).json({ message: "PDF generation failed" });
  } finally {
    // ✅ Close only the page, NOT the browser
    if (page) await page.close().catch(err => console.error("Error closing page:", err));
  }
});

module.exports = router;

