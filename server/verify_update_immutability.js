const API_URL = 'http://localhost:5000/api';

async function verifyImmutability() {
    console.log("🔍 Starting Verification: Booking ID Immutability");

    try {
        // 1. Get a booking to test with
        console.log("1️⃣ Fetching recent bookings...");
        const historyRes = await fetch(`${API_URL}/history`);
        if (!historyRes.ok) throw new Error(`History fetch failed: ${historyRes.status}`);

        const bookings = await historyRes.json();

        if (bookings.length === 0) {
            console.error("❌ No bookings found to test.");
            return;
        }

        const targetBooking = bookings[0];
        const originalId = targetBooking.bookingId;
        const originalName = targetBooking.guestName;
        console.log(`✅ Selected Booking: ${originalId} (${originalName})`);

        // 2. Attempt to update with a CHANGED Booking ID
        console.log("\n2️⃣ Attempting to UPDATE with MODIFIED Booking ID...");
        const maliciousId = "WFR_HACKED_999";
        const newName = originalName + " (Updated)";

        const updatePayload = {
            ...targetBooking,
            guestName: newName,
            bookingId: maliciousId // 🚨 This should be ignored
        };

        const updateRes = await fetch(`${API_URL}/booking/${originalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);

        const updatedBooking = await updateRes.json();

        // 3. Verify Results
        console.log("\n3️⃣ Verifying Result...");

        let success = true;

        // CHECK 1: ID should NOT change
        if (updatedBooking.bookingId === originalId) {
            console.log("✅ PASS: Booking ID remained unchanged.");
        } else {
            console.error(`❌ FAIL: Booking ID changed! Expected ${originalId}, got ${updatedBooking.bookingId}`);
            success = false;
        }

        // CHECK 2: Name SHOULD change (to prove update worked)
        if (updatedBooking.guestName === newName) {
            console.log("✅ PASS: Guest Name updated successfully.");
        } else {
            console.error(`❌ FAIL: Guest Name did not update. Update might have failed completely.`);
            success = false;
        }

        // CHECK 3: Verify via GET
        const getRes = await fetch(`${API_URL}/booking/${originalId}`);
        const getBooking = await getRes.json();

        if (getBooking.bookingId === originalId) {
            console.log("✅ PASS: Persistent fetch confirms ID is unchanged.");
        } else {
            console.error("❌ FAIL: Persistent fetch shows changed ID.");
            success = false;
        }

        if (success) {
            console.log("\n🎉 VERIFICATION SUCCESSFUL: Booking ID is Immutable.");
        } else {
            console.error("\n💥 VERIFICATION FAILED.");
        }

    } catch (error) {
        console.error("❌ Error running verification:", error.message);
    }
}

verifyImmutability();
