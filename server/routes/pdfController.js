const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const QRCode = require('qrcode');

router.post('/generate-pdf', async (req, res) => {
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

    const locationUrl =
      "https://www.google.com/maps/search/?api=1&query=Wayanad+Green+Valley+Resort";
    const qrCodeData = await QRCode.toDataURL(locationUrl);

    const roomImageMap = {
      Deluxe: 'deluxe.jpg',
      Premium: 'premium.jpg',
      Suite: 'suite.jpg'
    };

    const roomImage = roomImageMap[roomType] || 'deluxe.jpg';

    const baseUrl = `http://${req.get('host')}`;

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
      baseUrl,
      roomImage
    };

    const templatePath = path.join(
      __dirname,
      '../templates/booking-confirmation.ejs'
    );

    // Use absolute URLs for images (hosted on Vercel)
    // TODO: Make sure to set FRONTEND_URL in your Render environment variables to your actual Vercel app URL
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://resort-booking-confirmation.vercel.app';

    const logoData = `${FRONTEND_URL}/logo.jpg`;
    const roomImageData = `${FRONTEND_URL}/room.webp`;

    const html = await ejs.renderFile(templatePath, {
      ...data,
      logoData,
      roomImageData
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px'
      }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="booking_${guestName}.pdf"`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

module.exports = router;
