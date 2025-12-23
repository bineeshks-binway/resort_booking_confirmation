const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    guestName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: { // Number of persons (legacy) or Object { adults, children }
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: 1
    },
    // ✅ NEW: Multiple Rooms Support
    rooms: [
        {
            roomType: { type: String, required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true }, // Unit Price
            subtotal: { type: Number, required: true } // quantity * price
        }
    ],
    // Legacy / Primary Room Summary
    roomType: {
        type: String,
        required: true // We can keep this as "Primary Room" or comma separated
    },
    roomImage: {
        type: String
    },
    noOfRooms: {
        type: Number,
        default: 1
    },
    noOfNights: {
        type: Number,
        default: 1
    },
    mealPlan: {
        type: [String], // Array of strings (e.g., ['Breakfast', 'Dinner'])
        default: []
    },
    totalAmount: {
        type: Number,
        required: true
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    pendingAmount: {
        type: Number,
        default: 0
    },
    bookingStatus: {
        type: String,
        enum: ['CONFIRMED', 'PENDING', 'ON_HOLD'],
        default: 'CONFIRMED'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Optimization: Index for faster sorting by date
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
