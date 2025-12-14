const fs = require('fs');
const path = require('path');

async function testPhone(phone, label) {
    const data = {
        guestName: `Phone Test ${label}`,
        phoneNumber: phone,
        checkIn: "2024-01-01",
        checkOut: "2024-01-02",
        guests: 2,
        roomType: "Nalukettu",
        price: 10000,
        pendingAmount: 5000,
        bookingStatus: "CONFIRMED"
    };

    try {
        const response = await fetch('http://localhost:5000/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const filename = `test_phone_${label}.pdf`;
            fs.writeFileSync(path.join(__dirname, filename), Buffer.from(buffer));
            console.log(`SUCCESS: ${filename} created (Phone: ${phone})`);
        } else {
            console.log(`FAILED: ${label} - ${response.status}`);
        }
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await testPhone("9876543210", "no_code");
    await testPhone("+91 9876543210", "with_code");
}

run();
