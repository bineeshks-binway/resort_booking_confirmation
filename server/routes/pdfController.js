const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const QRCode = require("qrcode");
const fs = require("fs");
const Booking = require("../models/Booking");
const Counter = require("../models/Counter");

// ✅ OPTIMIZATION: Reuse Browser Instance
const getBrowser = async () => {
  console.log("🚀 Launching Puppeteer...");
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ],
      // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Commented out to rely on auto-downloaded chrome
    });
    console.log("✅ Puppeteer Launched!");
    return browser;
  } catch (e) {
    console.error("❌ Puppeteer Launch Failed:", e);
    throw e;
  }
};

const getImageAsBase64 = (filePath) => {
  try {
    const fullPath = path.join(__dirname, "../public/images", filePath);
    console.log(`🖼️ Loading Image: ${fullPath}`); // Debug log
    if (fs.existsSync(fullPath)) {
      const bitmap = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).substring(1);
      return `data:image/${ext};base64,${bitmap.toString("base64")}`;
    } else {
      console.warn(`⚠️ Image not found: ${fullPath}`);
    }
  } catch (err) {
    console.error(`❌ Error loading image ${filePath}:`, err.message);
  }
  return ""; // Return empty string instead of crashing or erroring
};

// ✅ HELPER: Get Next Booking ID
const getNextBookingId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: "bookingId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create if not exists
  );
  return `WFR${String(counter.seq).padStart(6, '0')}`;
};

// ✅ HELPER: Get Image Path based on Room Type
const getRoomImageFile = (roomType) => {
  const normalizedRoomType = roomType ? roomType.toLowerCase() : "";
  if (normalizedRoomType.includes("nalukettu")) return "rooms/nalukettu.png";
  if (normalizedRoomType.includes("pond view")) return "rooms/pondvilla.png";
  if (normalizedRoomType.includes("mana")) return "rooms/mana2.png";
  if (normalizedRoomType.includes("planters bungalow")) {
    return normalizedRoomType.includes("family") ? "rooms/planters_family.png" : "rooms/planters_bungalow.png";
  }
  if (normalizedRoomType.includes("studio")) return "rooms/studio.png";
  return "room.webp"; // fallback
};

// ✅ HELPER: Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
};

// ==========================================
// 🚀 API 1: CREATE BOOKING & GENERATE PDF
// ==========================================
router.post("/generate-pdf", async (req, res) => {
  let page = null;
  let browser = null;
  try {
    const {
      guestName,
      phoneNumber,
      checkIn,
      checkOut,
      guests,
      roomType,
      mealPlan,
      price,
      advanceAmount,
      pendingAmount,
      noOfRooms,
      noOfNights,
      bookingStatus = "CONFIRMED" // Default status
    } = req.body;

    console.log(`📝 Processing New Booking for: ${guestName}`);

    // 1️⃣ GENERATE BOOKING ID
    const bookingId = await getNextBookingId();
    console.log(`🆔 Generated Booking ID: ${bookingId}`);

    // 2️⃣ DETERMINE ROOM IMAGE
    const roomImageFile = getRoomImageFile(roomType); // e.g. "rooms/nalukettu.png"

    // 3️⃣ SAVE TO DATABASE
    const newBooking = new Booking({
      bookingId,
      guestName,
      phoneNumber,
      checkIn,
      checkOut,
      guests,
      roomType,
      roomImage: roomImageFile,
      mealPlan: Array.isArray(mealPlan) ? mealPlan : (mealPlan ? [mealPlan] : []),
      totalAmount: price,
      advanceAmount,
      pendingAmount,
      noOfRooms,
      noOfNights,
      bookingStatus
    });

    await newBooking.save();
    console.log("✅ Booking Saved to DB");

    // 4️⃣ PREPARE DATA FOR PDF
    let pdfTitle = "Booking Confirmation";
    if (bookingStatus === "PENDING") pdfTitle = "Booking Request";
    if (bookingStatus === "ON_HOLD") pdfTitle = "Reservation On Hold";

    const locationMappingUrl = "https://maps.app.goo.gl/ur6zxHXigwetPq74A";
    const qrCodeData = await QRCode.toDataURL(locationMappingUrl);
    const logoData = getImageAsBase64("logo.png");
    const roomImageData = getImageAsBase64(roomImageFile);

    let mealPlanDisplay = "None";
    if (newBooking.mealPlan && newBooking.mealPlan.length > 0) {
      mealPlanDisplay = newBooking.mealPlan.join(" | ");
    }

    const data = {
      guestName: newBooking.guestName,
      phoneNumber: newBooking.phoneNumber,
      checkIn: newBooking.checkIn,
      checkOut: newBooking.checkOut,
      guests: newBooking.guests,
      noOfRooms: newBooking.noOfRooms || 1,
      noOfNights: newBooking.noOfNights || 1,
      roomType: newBooking.roomType,
      mealPlan: mealPlanDisplay,
      price: newBooking.totalAmount || 0,
      priceFormatted: formatCurrency(newBooking.totalAmount),
      advanceAmount: newBooking.advanceAmount || 0,
      advanceAmountFormatted: formatCurrency(newBooking.advanceAmount),
      pendingAmount: newBooking.pendingAmount || 0,
      pendingAmountFormatted: formatCurrency(newBooking.pendingAmount),
      bookingId: newBooking.bookingId,
      bookingStatus: newBooking.bookingStatus,
      pdfTitle,
      qrCodeData,
      logoData,
      roomImages: [roomImageData, roomImageData, roomImageData] // Send array for Main + 2 Sub images
    };

    // 5️⃣ GENERATE PDF
    const templatePath = path.join(__dirname, "../templates/booking-confirmation.ejs");
    const html = await ejs.renderFile(templatePath, data);

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
    // await page.waitForSelector("img"); // Removed: Template uses CSS/Text only now

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    console.log("✅ PDF Generated successfully");

    // Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking_${guestName.replace(/\s+/g, '_')}_${bookingId}.pdf"`,
      "X-Booking-Id": bookingId // Send ID in header if needed by client
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Booking/PDF Error:", error);
    if (error.message.includes('Protocol error') || error.message.includes('Target closed')) {
      if (browserInstance) {
        await browserInstance.close().catch(() => { });
        browserInstance = null;
      }
    }
    res.status(500).json({ message: "Booking Processing Failed", error: error.message });
  } finally {
    if (page) await page.close().catch(err => console.error("Error closing page:", err));
    if (browser) await browser.close().catch(err => console.error("Error closing browser:", err));
  }
});

// ==========================================
// 🚀 API 1.5: RE-GENERATE PDF (GET)
// ==========================================
router.get("/booking/:id/pdf", async (req, res) => {
  let page = null;
  let browser = null;
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`📄 Re-generating PDF for: ${booking.guestName} (${booking.bookingId})`);

    const locationMappingUrl = "https://maps.app.goo.gl/ur6zxHXigwetPq74A";
    const qrCodeData = await QRCode.toDataURL(locationMappingUrl);
    const logoData = getImageAsBase64("logo.png");
    // const roomImageFile = getRoomImageFile(booking.roomType); // Use stored path if reliable
    // Use stored roomImage if available, else derive it
    const roomImageData = getImageAsBase64(booking.roomImage || getRoomImageFile(booking.roomType));

    let pdfTitle = "Booking Confirmation";
    if (booking.bookingStatus === "PENDING") pdfTitle = "Booking Request";
    if (booking.bookingStatus === "ON_HOLD") pdfTitle = "Reservation On Hold";

    let mealPlanDisplay = "None";
    if (booking.mealPlan && booking.mealPlan.length > 0) {
      mealPlanDisplay = booking.mealPlan.join(" | ");
    }

    const data = {
      guestName: booking.guestName,
      phoneNumber: booking.phoneNumber,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      noOfRooms: booking.noOfRooms || 1,
      noOfNights: booking.noOfNights || 1,
      roomType: booking.roomType,
      mealPlan: mealPlanDisplay,
      price: booking.totalAmount || 0,
      priceFormatted: formatCurrency(booking.totalAmount),
      advanceAmount: booking.advanceAmount || 0,
      advanceAmountFormatted: formatCurrency(booking.advanceAmount),
      pendingAmount: booking.pendingAmount || 0,
      pendingAmountFormatted: formatCurrency(booking.pendingAmount),
      bookingId: booking.bookingId,
      qrCodeData,
      logoData,
      roomImages: [roomImageData, roomImageData, roomImageData], // Send array for Main + 2 Sub images
      bookingStatus: booking.bookingStatus,
      pdfTitle
    };

    const templatePath = path.join(__dirname, "../templates/booking-confirmation.ejs");
    const html = await ejs.renderFile(templatePath, data);

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
    // await page.waitForSelector("img"); // Removed: Template uses CSS/Text only now

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking_${booking.guestName.replace(/\s+/g, '_')}_${booking.bookingId}.pdf"`
    });
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ PDF Re-generation Error:", error);
    res.status(500).json({ message: "PDF generation failed" });
  } finally {
    if (page) await page.close().catch(err => console.error("Error closing page:", err));
    if (browser) await browser.close().catch(err => console.error("Error closing browser:", err));
  }
});


// ==========================================
// 🚀 API 2: GET HISTORY (Grouped by Date)
// ==========================================
router.get("/history", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// ==========================================
// 🚀 API 3: GET BOOKING DETAILS
// ==========================================
router.get("/booking/:id", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Failed to fetch booking details" });
  }
});

// ==========================================
// 🚀 API 3.5: UPDATE BOOKING
// ==========================================
router.put("/booking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent changing _id
    delete updates._id;

    // Check for ID uniqueness if changing bookingId
    if (updates.bookingId) {
      const existing = await Booking.findOne({ bookingId: updates.bookingId });
      if (existing && existing._id.toString() !== (await Booking.findOne({ bookingId: id }))._id.toString()) {
        return res.status(400).json({ message: "Booking ID already exists" });
      }
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingId: id },
      { $set: updates },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`✅ Booking Updated: ${booking.bookingId}`);
    res.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Failed to update booking" });
  }
});

// ==========================================
// 🚀 API 4: SEARCH BOOKINGS
// ==========================================
router.get("/bookings/search", async (req, res) => {
  try {
    const { term, startDate, endDate } = req.query;
    let query = {};

    if (term) {
      query.$or = [
        { guestName: { $regex: term, $options: "i" } },
        { bookingId: { $regex: term, $options: "i" } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;

