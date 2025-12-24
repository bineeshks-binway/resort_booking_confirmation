const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const QRCode = require("qrcode");
const fs = require("fs");
const Booking = require("../models/Booking");
const Counter = require("../models/Counter");
const { sendBookingEmail } = require("../services/emailService");

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
// Ensures ID is always based on the HIGHEST ID in DB or Counter
const getNextBookingId = async () => {
  // 1. Find the current highest booking ID in the Booking collection
  const lastBooking = await Booking.findOne().sort({ bookingId: -1 });

  let maxSeqInDb = 1000; // Default start
  if (lastBooking && lastBooking.bookingId) {
    // Extract number from WFR000123
    const lastSeq = parseInt(lastBooking.bookingId.replace("WFR", ""), 10);
    // FIX: Always respect the minimum of 1000, even if DB has lower IDs
    if (!isNaN(lastSeq)) maxSeqInDb = Math.max(1000, lastSeq);
  }

  // 2. Atomically increment the counter to ensure strict sequence
  // We use findOneAndUpdate to get the fresh counter
  const counter = await Counter.findOne({ id: "bookingId" });
  let currentCounterSeq = counter ? counter.seq : 1000;

  // 3. Determine the next sequence
  // It must be greater than both the DB max and the current counter
  let nextSeq = Math.max(maxSeqInDb, currentCounterSeq) + 1;

  // 4. Sync the counter to this new high water mark
  await Counter.findOneAndUpdate(
    { id: "bookingId" },
    { $set: { seq: nextSeq } },
    { upsert: true, new: true }
  );

  return `WFR${String(nextSeq).padStart(6, '0')}`;
};

// ✅ HELPER: Peek Next Booking ID (Without incrementing)
const getNextBookingIdPeek = async () => {
  const lastBooking = await Booking.findOne().sort({ bookingId: -1 });
  let maxSeqInDb = 990;
  if (lastBooking && lastBooking.bookingId) {
    const lastSeq = parseInt(lastBooking.bookingId.replace("WFR", ""), 10);
    // FIX: Always respect the minimum of 990, even if DB has lower IDs
    if (!isNaN(lastSeq)) maxSeqInDb = Math.max(990, lastSeq);
  }

  const counter = await Counter.findOne({ id: "bookingId" });
  let currentCounterSeq = counter ? counter.seq : 990;

  let nextSeq = Math.max(maxSeqInDb, currentCounterSeq) + 1;
  return `WFR${String(nextSeq).padStart(6, '0')}`;
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

// ✅ HELPER: Format Guests for Display
const formatGuests = (guests) => {
  if (!guests) return "0 Guests";
  if (typeof guests === 'object') {
    const adults = guests.adults || 0;
    const children = guests.children || 0;
    return `${adults} Adults + ${children} Children`;
  }
  return `${guests} Guests`; // Legacy number support
};

// ==========================================
// 🚀 API 1: CREATE BOOKING & GENERATE PDF
// ==========================================
// ✅ CONSTANT: Room Prices (Trusted Source)
const ROOM_PRICES = {
  'Nalukettu': 6500,
  'Pond View Villa': 10500,
  'Mana 2 Bedroom Villa': 16500,
  'Planters Bungalow': 8500,
  'Planters Family Bungalow': 10500,
  'Studio Bedroom with Balcony': 5000
};

// ✅ HELPER: Calculate Booking Total
const calculateBookingTotal = (rooms, noOfNights) => {
  if (!rooms || !Array.isArray(rooms)) return 0;

  let totalPerNight = 0;
  rooms.forEach(room => {
    // 1. Get Base Price
    // Allow fuzzy matching or exact match. For now exact match based on ID or string.
    // Frontend sends exact keys.
    const price = ROOM_PRICES[room.roomType] || 0;

    // 2. Multiply by Quantity
    const qty = Number(room.quantity) || 1;

    totalPerNight += (price * qty);
  });

  return totalPerNight * (Number(noOfNights) || 1);
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
      adults,
      children,
      rooms, // 🚀 NEW: Array of rooms
      roomType, // Legacy/Summary
      noOfRooms, // Legacy/Summary
      mealPlan,
      // price, // ❌ IGNORE CLIENT PRICE
      advanceAmount,
      // pendingAmount, // ❌ IGNORE CLIENT PENDING
      noOfNights,
      bookingStatus = "CONFIRMED"
    } = req.body;

    // Normalize Guests
    let finalGuests = guests;
    if (adults || children) {
      finalGuests = {
        adults: Number(adults || 0),
        children: Number(children || 0)
      };
    } else if (typeof guests === 'number') {
      finalGuests = guests;
    }

    // 🔒 BACKEND VALIDATION: Check Dates
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    if (endDate <= startDate) {
      return res.status(400).json({ message: "Check-out date must be strictly after check-in date." });
    }

    // 🔒 BACKEND VALIDATION: Rooms
    let finalRooms = rooms;
    if (!finalRooms || !Array.isArray(finalRooms) || finalRooms.length === 0) {
      // Create single room entry from legacy fields if rooms array missing
      if (roomType) {
        finalRooms = [{
          roomType: roomType,
          quantity: Number(noOfRooms || 1)
        }];
      } else {
        return res.status(400).json({ message: "At least one room is required." });
      }
    }

    // 🔒 TRUSTED CALCULATION: Price
    // Always calculate price on server. Never trust client 'price'.
    const totalAmount = calculateBookingTotal(finalRooms, noOfNights);
    const calculatedPendingString = (totalAmount - (Number(advanceAmount) || 0)).toFixed(0);
    const pendingAmount = Number(calculatedPendingString);

    console.log(`📝 Processing New Booking for: ${guestName}`);
    console.log(`💰 Calculated Total: ₹${totalAmount} (Advance: ₹${advanceAmount}, Pending: ₹${pendingAmount})`);

    // 1️⃣ GENERATE BOOKING ID
    const bookingId = await getNextBookingId();
    console.log(`🆔 Generated Booking ID: ${bookingId}`);

    // 2️⃣ DETERMINE MAIN IMAGE (Use first room's type)
    const primaryRoomType = finalRooms[0].roomType;
    const roomImageFile = getRoomImageFile(primaryRoomType);

    // 3️⃣ SAVE TO DATABASE
    const newBooking = new Booking({
      bookingId,
      guestName,
      phoneNumber,
      checkIn,
      checkOut,
      guests: finalGuests,
      rooms: finalRooms, // Save the array
      roomType: finalRooms.map(r => r.roomType).join(", "), // Summary string
      noOfRooms: finalRooms.reduce((sum, r) => sum + Number(r.quantity || 0), 0), // Total count
      roomImage: roomImageFile,
      mealPlan: Array.isArray(mealPlan) ? mealPlan : (mealPlan ? [mealPlan] : []),
      totalAmount: totalAmount, // ✅ USE CALCULATED
      advanceAmount: Number(advanceAmount) || 0,
      pendingAmount: pendingAmount, // ✅ USE CALCULATED
      noOfNights,
      bookingStatus
    });

    await newBooking.save();
    console.log("✅ Booking Saved to DB");

    // 📧 SEND EMAIL NOTIFICATION
    try {
      const emailData = {
        bookingId: newBooking.bookingId,
        guestName: newBooking.guestName,
        phoneNumber: newBooking.phoneNumber,
        checkIn: newBooking.checkIn,
        checkOut: newBooking.checkOut,
        guests: formatGuests(newBooking.guests),
        // Pass rooms array to email template
        rooms: newBooking.rooms,
        // Legacy fallbacks for template safety
        roomType: newBooking.roomType,
        noOfRooms: newBooking.noOfRooms,

        mealPlan: Array.isArray(newBooking.mealPlan) ? newBooking.mealPlan.join(", ") : (newBooking.mealPlan || "None"),
        priceFormatted: formatCurrency(newBooking.totalAmount),
        advanceAmountFormatted: formatCurrency(newBooking.advanceAmount),
        pendingAmountFormatted: formatCurrency(newBooking.pendingAmount),
        noOfNights: newBooking.noOfNights
      };

      sendBookingEmail(emailData).catch(err => console.error("⚠️ Background Email Failed:", err.message));

    } catch (emailErr) {
      console.error("⚠️ Email Preparation Failed:", emailErr);
    }

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
      guests: formatGuests(newBooking.guests),
      guestDetails: newBooking.guests, // 🚀 Pass raw object for safer EJS logic

      // Multi-room support
      rooms: newBooking.rooms,

      // Legacy/Summary for templates not yet updated or header display
      noOfRooms: newBooking.noOfRooms,
      roomType: newBooking.roomType,

      noOfNights: newBooking.noOfNights || 1,
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
      roomImages: [roomImageData, roomImageData, roomImageData]
    };

    // 5️⃣ GENERATE PDF
    const templatePath = path.join(__dirname, "../templates/booking-confirmation.ejs");
    const html = await ejs.renderFile(templatePath, data);

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    console.log("✅ PDF Generated successfully");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking_${guestName.replace(/\s+/g, '_')}_${bookingId}.pdf"`,
      "X-Booking-Id": bookingId
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Booking/PDF Error:", error);
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

    // Determine image (use first room if rooms array exists)
    let roomTypeForImage = booking.roomType;
    if (booking.rooms && booking.rooms.length > 0) {
      roomTypeForImage = booking.rooms[0].roomType;
    }
    const roomImageData = getImageAsBase64(booking.roomImage || getRoomImageFile(roomTypeForImage));

    let pdfTitle = "Booking Confirmation";
    if (booking.bookingStatus === "PENDING") pdfTitle = "Booking Request";
    if (booking.bookingStatus === "ON_HOLD") pdfTitle = "Reservation On Hold";

    let mealPlanDisplay = "None";
    if (booking.mealPlan && booking.mealPlan.length > 0) {
      mealPlanDisplay = booking.mealPlan.join(" | ");
    }

    // Ensure 'rooms' array availability for older bookings
    let roomsData = booking.rooms;
    if (!roomsData || roomsData.length === 0) {
      // Construct from legacy
      roomsData = [{
        roomType: booking.roomType,
        quantity: booking.noOfRooms,
        price: booking.totalAmount / booking.noOfRooms, // approx
        subtotal: booking.totalAmount // approximation since we don't know detailed split
      }];
    }

    const data = {
      guestName: booking.guestName,
      phoneNumber: booking.phoneNumber,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: formatGuests(booking.guests),
      guestDetails: booking.guests, // 🚀 Pass raw object for safer EJS logic

      // Rooms
      rooms: roomsData,
      noOfRooms: booking.noOfRooms || 1,
      roomType: booking.roomType,

      noOfNights: booking.noOfNights || 1,
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
      roomImages: [roomImageData, roomImageData, roomImageData],
      bookingStatus: booking.bookingStatus,
      pdfTitle
    };

    const templatePath = path.join(__dirname, "../templates/booking-confirmation.ejs");
    const html = await ejs.renderFile(templatePath, data);

    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDocs = await Booking.countDocuments();
    const hasMore = skip + bookings.length < totalDocs;

    res.json({
      bookings,
      currentPage: page,
      totalPages: Math.ceil(totalDocs / limit),
      hasMore,
      totalBooks: totalDocs
    });
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

    // 🔒 SECURITY: Prevent changing Immutable Fields
    delete updates._id;
    delete updates.bookingId;
    delete updates.createdAt;

    // ❌ IGNORE CLIENT PRICE
    // We will recalculate this below if rooms or dates change.
    // If client tries to set 'totalAmount' or 'pendingAmount', we ignore it.
    // However, if we only partial update, we need to be careful.
    // To simplify: We recalculate Total, Pending if relevant fields are present.
    // If not, we might be in trouble. But effectively the edit form sends everything.

    // 🔒 BACKEND VALIDATION: Check Dates
    if (updates.checkIn && updates.checkOut) {
      if (new Date(updates.checkOut) <= new Date(updates.checkIn)) {
        return res.status(400).json({ message: "Check-out date must be strictly after check-in date." });
      }
    }

    // 🚀 Handle Rooms Update & Recalculate Prices
    // We expect the full room array if it's being updated.
    if (updates.rooms && Array.isArray(updates.rooms)) {
      updates.roomType = updates.rooms.map(r => r.roomType).join(", ");
      updates.noOfRooms = updates.rooms.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

      // RECALCULATE PRICE
      // We need 'noOfNights'. If not in updates, we might need to fetch existing booking.
      // But typically Edit Form sends all fields.
      if (updates.noOfNights) {
        const newTotal = calculateBookingTotal(updates.rooms, updates.noOfNights);
        updates.totalAmount = newTotal;

        const advance = Number(updates.advanceAmount) || 0; // Or fetch existing?
        // Assuming client sends advanceAmount in updates (Edit form does)
        updates.pendingAmount = newTotal - advance;
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
      // Set start date to beginning of day
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      // Set end date to end of day
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(100); // Limit search results too
    res.json(bookings);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

// ==========================================
// 🚀 API 5: GET NEXT BOOKING ID (PEEK)
// ==========================================
router.get("/next-booking-id", async (req, res) => {
  try {
    const nextId = await getNextBookingIdPeek();
    res.json({ bookingId: nextId });
  } catch (error) {
    console.error("Error fetching next booking ID:", error);
    res.status(500).json({ message: "Failed to fetch next booking ID" });
  }
});

// ==========================================
// 🚀 API 6: TEST EMAIL
// ==========================================
router.get("/test-email", async (req, res) => {
  // DEBUGGING ALERT: Check loaded credentials safely
  const email = process.env.RESORT_EMAIL || "";
  const apiKey = process.env.BREVO_API_KEY || "";

  const debugInfo = {
    email_configured: !!email,
    brevo_key_configured: !!apiKey,
    brevo_key_prefix: apiKey ? apiKey.substring(0, 5) + "..." : "MISSING",
    email_has_spaces: /\s/.test(email)
  };

  try {
    const { sendTestEmail } = require("../services/emailService");
    const recipient = req.query.to; // Allow ?to=user@gmail.com
    const info = await sendTestEmail(recipient);
    res.json({
      message: "Test email sent successfully",
      recipient: recipient || "Same as Sender",
      messageId: info.messageId,
      debug: debugInfo
    });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      message: "Test email failed",
      error: error.message,
      errorCode: error.code,
      response: error.response,
      debug: debugInfo // Return debug info even on failure
    });
  }
});

module.exports = router;

