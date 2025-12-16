const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const connectDB = require('./config/db');
require('dotenv').config();

const clearBookings = async () => {
    try {
        await connectDB();
        console.log("Connected...");

        await Booking.deleteMany({});
        console.log("All bookings deleted.");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

clearBookings();
