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

    // Read images and convert to base64
    const fs = require('fs');

    // Function to encode file to base64
    const base64_encode = (file) => {
      try {
        const bitmap = fs.readFileSync(file);
        const ext = path.extname(file).substring(1);
        return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${new Buffer.from(bitmap).toString('base64')}`;
      } catch (e) {
        console.error('Error reading file:', file, e);
        return '';
      }
    };

    const logoPath = path.join(__dirname, '../../client/public/logo.jpg');
    const roomPath = path.join(__dirname, '../../client/public/room.webp');

    const logoData = base64_encode(logoPath);
    const roomImageData = base64_encode(roomPath);

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
