const fs = require('fs');

async function testID() {
    const data = {
        guestName: `ID Test`,
        phoneNumber: "9876543210",
        checkIn: "2024-01-01",
        checkOut: "2024-01-02",
        guests: 2,
        roomType: "Nalukettu",
        price: 10000,
        pendingAmount: 5000,
        bookingStatus: "CONFIRMED"
    };

    try {
        console.log("Generating booking to test ID...");
        const response = await fetch('http://localhost:5000/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const bookingId = response.headers.get('X-Booking-Id');
            console.log(`Generated Booking ID: ${bookingId}`);

            if (bookingId === 'WFR001001') {
                console.log("SUCCESS: ID is WFR001001");
            } else {
                console.log("FAILED: Expected WFR001001 but got " + bookingId);
            }
        } else {
            console.log("FAILED: " + response.status);
        }
    } catch (err) {
        console.error(err);
    }
}

testID();
