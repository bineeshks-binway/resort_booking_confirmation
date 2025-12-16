const mongoose = require('mongoose');
const Counter = require('./models/Counter');
require('dotenv').config();

const connectDB = require('./config/db');

const resetCounter = async () => {
    try {
        await connectDB();

        console.log("Connected to DB...");

        const result = await Counter.findOneAndUpdate(
            { id: "bookingId" },
            { $set: { seq: 990 } }, // Set to 990 so next inc makes it 991 (WFR000991)
            { new: true, upsert: true }
        );

        console.log("Counter reset successfully:", result);
        process.exit(0);
    } catch (err) {
        console.error("Error resetting counter:", err);
        process.exit(1);
    }
};

resetCounter();
