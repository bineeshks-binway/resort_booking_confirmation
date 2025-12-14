const fs = require('fs');
const path = require('path');

const data = {
    guestName: "Test User",
    phoneNumber: "9876543210",
    checkIn: "2024-01-01",
    checkOut: "2024-01-02",
    guests: 2,
    roomType: "Nalukettu",
    mealPlan: "Breakfast",
    price: 10000,
    advanceAmount: 5000,
    pendingAmount: 5000,
    noOfRooms: 1,
    noOfNights: 1
};

async function generatePDF() {
    try {
        console.log("Sending request to generate PDF...");
        const response = await fetch('http://localhost:5000/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const outputPath = path.join(__dirname, 'test_booking_verified.pdf');
            fs.writeFileSync(outputPath, Buffer.from(buffer));
            console.log(`SUCCESS: PDF verified and saved to ${outputPath}`);
            console.log(`PDF Size: ${buffer.byteLength} bytes`);
        } else {
            console.error(`FAILED: Unexpected status code ${response.status}`);
            const text = await response.text();
            console.error(`Response: ${text}`);
        }
    } catch (error) {
        console.error("FAILED: Error generating PDF");
        console.error(error.message);
    }
}

generatePDF();
