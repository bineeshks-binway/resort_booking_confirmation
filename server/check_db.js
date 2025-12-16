const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const connectDB = require('./config/db');
require('dotenv').config();

const checkMaxId = async () => {
    try {
        await connectDB();
        console.log("Connected...");

        const lastBooking = await Booking.findOne().sort({ bookingId: -1 });
        console.log("Max Booking ID found:", lastBooking ? lastBooking.bookingId : "None");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkMaxId();
