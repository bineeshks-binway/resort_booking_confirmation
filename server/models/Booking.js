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
    guests: { // Number of persons
        type: Number,
        required: true,
        default: 1
    },
    roomType: {
        type: String,
        required: true
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

module.exports = mongoose.model('Booking', bookingSchema);
