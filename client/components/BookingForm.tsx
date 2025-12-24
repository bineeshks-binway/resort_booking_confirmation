"use client";

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Card } from './Card';
import { ArrowRight, Download, Calculator, History, Save, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const ROOM_PRICES: Record<string, number> = {
    'Nalukettu': 6500,
    'Pond View Villa': 10500,
    'Mana 2 Bedroom Villa': 16500,
    'Planters Bungalow': 8500,
    'Planters Family Bungalow': 10500,
    'Studio Bedroom with Balcony': 5000
};

const MEAL_PLANS = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Evening Tea Snacks'
];

const BOOKING_STATUSES = [
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ON_HOLD', label: 'Not Confirmed' }
];

interface RoomEntry {
    roomType: string;
    quantity: number;
    price: number;
    subtotal: number;
}

interface BookingFormProps {
    initialData?: any;
    isEditMode?: boolean;
    bookingId?: string;
}

export const BookingForm = ({ initialData, isEditMode = false, bookingId }: BookingFormProps) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        guestName: '',
        phoneNumber: '+91 ',
        checkIn: '',
        checkOut: '',
        guests: { adults: '2', children: '0' }, // Kept as strings for input behavior

        // 🚀 NEW: Multiple Rooms State
        rooms: [
            { roomType: 'Nalukettu', quantity: 1, price: 6500, subtotal: 6500 }
        ] as RoomEntry[],

        noOfNights: '1',
        mealPlan: [] as string[],
        price: '6500', // Total Amount
        advanceAmount: '0',
        pendingAmount: 6500,
        bookingStatus: 'CONFIRMED'
    });

    const [loading, setLoading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Initialize form with existing data if in Edit Mode
    useEffect(() => {
        if (initialData) {
            // ✅ Handle Legacy Data vs New Data
            // If initialData has 'rooms' array, use it.
            // Else, construct it from legacy single fields.
            let loadedRooms: RoomEntry[] = [];

            if (initialData.rooms && Array.isArray(initialData.rooms) && initialData.rooms.length > 0) {
                loadedRooms = initialData.rooms;
            } else {
                // FALLBACK: Legacy Migration
                loadedRooms = [{
                    roomType: initialData.roomType || 'Nalukettu',
                    quantity: Number(initialData.noOfRooms || 1),
                    price: ROOM_PRICES[initialData.roomType] || 0, // Approx
                    subtotal: (ROOM_PRICES[initialData.roomType] || 0) * Number(initialData.noOfRooms || 1)
                }];
            }

            setFormData(prev => ({
                ...prev,
                ...initialData,
                checkIn: initialData.checkIn ? new Date(initialData.checkIn).toISOString().split('T')[0] : '',
                checkOut: initialData.checkOut ? new Date(initialData.checkOut).toISOString().split('T')[0] : '',
                rooms: loadedRooms,
                price: String(initialData.totalAmount || initialData.price || 0),
                advanceAmount: String(initialData.advanceAmount || 0),
                pendingAmount: Number(initialData.pendingAmount),
                guests: typeof initialData.guests === 'object'
                    ? {
                        adults: String(initialData.guests.adults || 2),
                        children: String(initialData.guests.children || 0)
                    }
                    : { adults: String(initialData.guests || 2), children: '0' },
                noOfNights: String(initialData.noOfNights || 1)
            }));
        }
    }, [initialData]);

    // ✅ Auto Calculation: Nights
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0 && diffDays !== Number(formData.noOfNights)) {
                setFormData(prev => ({ ...prev, noOfNights: String(diffDays) }));
            }
        }
    }, [formData.checkIn, formData.checkOut]);

    // ✅ Price Calculation (Triggered when rooms or nights change)
    useEffect(() => {
        const nights = Number(formData.noOfNights) || 1;

        let totalRoomCost = 0;
        const updatedRooms = formData.rooms.map(r => {
            const unitPrice = ROOM_PRICES[r.roomType] || 0;
            // Ensure quantity is at least 1
            const qty = r.quantity || 1;
            const subtotal = unitPrice * qty; // Total for this room type per night (basically)
            // Wait, usually price is per night? Yes.
            // So Total = (Sum of all room subtotals) * Nights

            totalRoomCost += subtotal;
            return { ...r, price: unitPrice, subtotal };
        });

        const grandTotal = totalRoomCost * nights;

        // We only update the TOTAL string here. 
        // We DON'T update 'rooms' state inside this effect to avoid infinite loops if we were setting rooms.
        // But since we are only setting 'price', it's fine.
        // However, if we want to display the updated subtotals in the UI immediately, we should do it at the input handler level, NOT here.
        // Doing it here might cause re-renders or loop if we set rooms.

        // BETTER APPROACH: Calculate total on the fly based on current state,
        // OR only update 'price' state here.
        setFormData(prev => ({ ...prev, price: String(grandTotal) }));

    }, [formData.rooms, formData.noOfNights]); // Dep: rooms (deep check?) - actually react checks reference.

    // ✅ Pending Amount Calculation
    useEffect(() => {
        const p = Number(formData.price) || 0;
        const a = Number(formData.advanceAmount) || 0;
        setFormData(prev => ({ ...prev, pendingAmount: p - a }));
    }, [formData.price, formData.advanceAmount]);


    // --- HANDLERS ---

    const getTodayDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getNextDay = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let newVal: any = value;
            const updates: any = {};
            if (name === 'checkIn') updates.checkOut = '';

            if (['noOfNights', 'price', 'advanceAmount'].includes(name)) { // Removed 'noOfRooms'
                if (value === '' || /^[0-9]+$/.test(value)) {
                    if (value.length > 1 && value.startsWith('0')) {
                        newVal = value.replace(/^0+/, '');
                        if (newVal === '') newVal = '0';
                    } else {
                        newVal = value;
                    }
                } else {
                    return prev;
                }
            }
            return { ...prev, [name]: newVal, ...updates };
        });
    };

    const handleGuestChange = (type: 'adults' | 'children', value: string) => {
        if (value === '' || /^[0-9]+$/.test(value)) {
            let newVal = value;
            if (newVal.length > 1 && newVal.startsWith('0')) newVal = newVal.replace(/^0+/, '') || '0';
            setFormData(prev => ({ ...prev, guests: { ...prev.guests, [type]: newVal } }));
        }
    };

    const handleMealToggle = (plan: string) => {
        setFormData(prev => {
            const current = prev.mealPlan;
            const updated = current.includes(plan) ? current.filter(p => p !== plan) : [...current, plan];
            return { ...prev, mealPlan: updated };
        });
    };

    // --- ROOM LOGIC ---

    const addRoom = () => {
        setFormData(prev => {
            // Check if duplicates allowed? Requirement: "Prevent duplicate room types"
            // So we should find the first available room type that is not used.
            const usedTypes = prev.rooms.map(r => r.roomType);
            const availableType = Object.keys(ROOM_PRICES).find(t => !usedTypes.includes(t));

            if (!availableType) {
                alert("All room types are already selected!");
                return prev;
            }

            const newRoom: RoomEntry = {
                roomType: availableType,
                quantity: 1,
                price: ROOM_PRICES[availableType],
                subtotal: ROOM_PRICES[availableType]
            };

            return { ...prev, rooms: [...prev.rooms, newRoom] };
        });
    };

    const removeRoom = (index: number) => {
        setFormData(prev => {
            if (prev.rooms.length <= 1) {
                alert("At least one room is required.");
                return prev;
            }
            return {
                ...prev,
                rooms: prev.rooms.filter((_, i) => i !== index)
            };
        });
    };

    const updateRoom = (index: number, field: keyof RoomEntry, value: any) => {
        setFormData(prev => {
            const updatedRooms = [...prev.rooms];
            const room = { ...updatedRooms[index] };

            if (field === 'roomType') {
                // Check duplicate
                if (prev.rooms.some((r, i) => i !== index && r.roomType === value)) {
                    alert("This room type is already selected.");
                    return prev;
                }
                room.roomType = value;
                room.price = ROOM_PRICES[value];
            }

            if (field === 'quantity') {
                // Ensure valid number
                const qty = Number(value);
                room.quantity = qty > 0 ? qty : 1;
            }

            // Recalculate subtotal
            room.subtotal = room.price * room.quantity;
            updatedRooms[index] = room;

            return { ...prev, rooms: updatedRooms };
        });
    };


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare Payload
            const payload = {
                ...formData,
                guests: {
                    adults: Number(formData.guests.adults || 0),
                    children: Number(formData.guests.children || 0)
                },
                // Flatten / Summarize for Legacy fields if needed, OR backend handles it.
                // We will send 'rooms' array.
                // Legacy fields for summary:
                roomType: formData.rooms.map(r => r.roomType).join(', '),
                noOfRooms: formData.rooms.reduce((acc, r) => acc + r.quantity, 0),
                noOfNights: Number(formData.noOfNights || 1),

                // Financials
                totalAmount: Number(formData.price || 0), // Usually calculated, but user can edit total?
                price: Number(formData.price || 0), // Alias
                advanceAmount: Number(formData.advanceAmount || 0),
                pendingAmount: Number(formData.pendingAmount || 0)
            };

            if (isEditMode && bookingId) {
                await api.put(`/api/booking/${bookingId}`, payload);
                alert("Booking Updated Successfully!");
                router.push('/history');
            } else {
                const res = await api.post('/api/generate-pdf', payload, { responseType: 'blob' });

                // Download
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `booking_${formData.guestName.replace(/\s+/g, '_')}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();

                const newBookingId = res.headers['x-booking-id'];
                if (newBookingId) setTimeout(() => router.push(`/booking/${newBookingId}`), 1000);
            }
        } catch (error: any) {
            console.error("Submission failed", error);
            alert(`Action Failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!bookingId) return;
        setDownloadingPdf(true);
        try {
            const res = await api.get(`/api/booking/${bookingId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking_${formData.guestName.replace(/\s+/g, '_')}_${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("PDF Download failed", error);
            alert("Failed to download PDF");
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <Button variant="secondary" onClick={() => router.push('/')} className="flex items-center gap-2 text-sm">
                    Create New
                </Button>
                <Button variant="secondary" onClick={() => router.push('/history')} className="flex items-center gap-2 text-sm">
                    <History className="w-4 h-4" /> View History
                </Button>
            </div>

            <Card className="w-full max-w-4xl mx-auto" title={isEditMode ? `Edit Booking: ${bookingId}` : "New Booking Entry"}>
                <form onSubmit={handleFormSubmit} className="space-y-6">

                    {/* Section 1: Guest Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Guest Name" name="guestName" value={formData.guestName} onChange={handleChange} placeholder="Enter Full Name" required />
                        <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+91 9876543210" required />
                    </div>

                    {/* Section 2: Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <Input
                            label="Check-In" type="date" name="checkIn" value={formData.checkIn} onChange={handleChange}
                            min={getTodayDate()} onKeyDown={(e) => e.preventDefault()} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} required
                        />
                        <div className="relative">
                            <Input
                                label="Check-Out"
                                key={formData.checkIn ? `checkout-active-${formData.checkIn}` : 'checkout-disabled'}
                                type="date" name="checkOut" value={formData.checkOut} onChange={handleChange}
                                min={formData.checkIn ? getNextDay(formData.checkIn) : ''}
                                onKeyDown={(e) => e.preventDefault()} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                disabled={!formData.checkIn}
                                className={!formData.checkIn ? "bg-gray-100 cursor-not-allowed opacity-60" : ""} required
                            />
                        </div>
                        <Input label="Nights" type="text" inputMode="numeric" name="noOfNights" value={formData.noOfNights} onChange={handleChange} />
                        <Input label="Adults" type="text" inputMode="numeric" name="adults" value={formData.guests.adults} onChange={(e) => handleGuestChange('adults', e.target.value)} required />
                        <Input label="Children" type="text" inputMode="numeric" name="children" value={formData.guests.children} onChange={(e) => handleGuestChange('children', e.target.value)} />
                    </div>

                    {/* Section 3: Rooms (Replacing Single Room Type) */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Room Details</h3>
                            <Button type="button" variant="secondary" onClick={addRoom} className="text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Room
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.rooms.map((room, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">
                                    <div className="flex-grow">
                                        <Select
                                            label="Room Type"
                                            name={`roomType-${index}`}
                                            value={room.roomType}
                                            onChange={(e) => updateRoom(index, 'roomType', e.target.value)}
                                            options={Object.keys(ROOM_PRICES).map(r => ({ value: r, label: r }))}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            label="Qty"
                                            type="number"
                                            min="1"
                                            value={String(room.quantity)}
                                            onChange={(e) => updateRoom(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    {/* Price Removed from Room Row */}
                                    <div className="pb-1">
                                        {formData.rooms.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRoom(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove Room"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Meal Plan */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Meal Plan</label>
                        <div className="flex flex-wrap gap-2">
                            {MEAL_PLANS.map(plan => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => handleMealToggle(plan)}
                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${formData.mealPlan.includes(plan)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
                                        }`}
                                >
                                    {plan}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 5: Payment */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <Select label="Booking Status" name="bookingStatus" value={formData.bookingStatus} onChange={handleChange} options={BOOKING_STATUSES} />
                        </div>
                        <div className="space-y-4">
                            {/* New Summary Details */}
                            <div className="flex border-b pb-4 border-gray-200">
                                <div className="flex-1 text-center border-r border-gray-200 px-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Total Rooms</label>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {formData.rooms.reduce((acc, r) => acc + (r.quantity || 1), 0)}
                                    </div>
                                </div>
                                <div className="flex-1 text-center px-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Total Nights</label>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {formData.noOfNights}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input
                                    label="Grand Total (₹)"
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    onChange={() => { }} // Read-only
                                    disabled
                                    className="bg-gray-100 font-bold text-lg"
                                />
                                <Input
                                    label="Advance Paid (₹)"
                                    type="text"
                                    inputMode="numeric"
                                    name="advanceAmount"
                                    value={formData.advanceAmount}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Pending Amount (₹)"
                                    type="text"
                                    name="pendingAmount"
                                    value={String(formData.pendingAmount)}
                                    onChange={() => { }}
                                    disabled
                                    className="bg-red-50 text-red-600 font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row justify-end gap-3">
                        {isEditMode && (
                            <Button type="button" variant="secondary" onClick={handleDownloadPDF} isLoading={downloadingPdf} className="flex items-center gap-2">
                                <Download className="w-4 h-4" /> Download PDF
                            </Button>
                        )}
                        <Button type="submit" isLoading={loading} className="w-full md:w-auto flex items-center gap-2">
                            {isEditMode ? <Save className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {isEditMode ? "Update Booking Changes" : "Generate PDF & Create Booking"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
