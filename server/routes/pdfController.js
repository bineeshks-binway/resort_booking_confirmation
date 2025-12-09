const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const QRCode = require("qrcode");

const fs = require("fs");

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

    // ✅ QR Code (Google Maps)
    const locationUrl =
      "https://www.google.com/maps/search/?api=1&query=Wayanad+Green+Valley+Resort";
    const qrCodeData = await QRCode.toDataURL(locationUrl);

    // ✅ LOGO (Base64)
    const logoData = getImageAsBase64("logo.jpg");

    // ✅ Room images (Base64 - using room.webp for all)
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
    const templatePath = path.join(
      __dirname,
      "../templates/booking-confirmation.ejs"
    );

    // ✅ Render EJS to HTML
    const html = await ejs.renderFile(templatePath, data);

    // ✅ Launch Puppeteer (Render safe)
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // ✅ IMPORTANT: wait until images fully load
    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.waitForSelector("img");

    // ✅ Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
      }
    });

    await browser.close();

    // ✅ Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking_${guestName}.pdf"`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

module.exports = router;

