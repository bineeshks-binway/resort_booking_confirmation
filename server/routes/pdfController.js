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

        // Generate QR Code with location
        const locationUrl = "https://www.google.com/maps/search/?api=1&query=Wayanad+Green+Valley+Resort";
        const qrCodeData = await QRCode.toDataURL(locationUrl);

        // Get Room Image Path
        const roomImageMap = {
            'Deluxe': 'deluxe.jpg',
            'Premium': 'premium.jpg',
            'Suite': 'suite.jpg'
        };
        const roomImage = roomImageMap[roomType] || 'deluxe.jpg';

        // Host URL for assets
        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

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

        // Render EJS
        const templatePath = path.join(__dirname, '../templates/booking-confirmation.ejs');
        const html = await ejs.renderFile(templatePath, data);

        // Launch Puppeteer
        const browser = await puppeteer.launch({ headless: "new" });
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
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="booking_${guestName}.pdf"`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Error generating PDF');
    }
});

module.exports = router;
