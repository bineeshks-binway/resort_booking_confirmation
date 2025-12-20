"use client";

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Card } from './Card';
import { ArrowRight, Download, Calculator, History, Save } from 'lucide-react';
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
        guests: { adults: '2', children: '0' },
        roomType: 'Nalukettu',
        noOfRooms: '1',
        noOfNights: '1',
        mealPlan: [] as string[],
        price: '6500', // String for input UX
        advanceAmount: '0', // String for input UX
        pendingAmount: 6500, // Calculated number
        bookingStatus: 'CONFIRMED'
    });

    const [loading, setLoading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Initialize form with existing data if in Edit Mode
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                checkIn: initialData.checkIn ? new Date(initialData.checkIn).toISOString().split('T')[0] : '',
                checkOut: initialData.checkOut ? new Date(initialData.checkOut).toISOString().split('T')[0] : '',
                // Ensure numeric fields are numbers
                // Ensure numeric fields are numbers, but converted to string for inputs
                price: String(initialData.totalAmount || initialData.price || 0),
                advanceAmount: String(initialData.advanceAmount || 0),
                pendingAmount: Number(initialData.pendingAmount),
                guests: typeof initialData.guests === 'object'
                    ? {
                        adults: String(initialData.guests.adults || 2),
                        children: String(initialData.guests.children || 0)
                    }
                    : { adults: String(initialData.guests || 2), children: '0' },
                noOfRooms: String(initialData.noOfRooms || 1),
                noOfNights: String(initialData.noOfNights || 1)
            }));
        }
    }, [initialData]);

    // ✅ Auto Calculation Logic (Only calculate if user actively changes dates in UI, or on initial load if we want to force recalc - but better to trust DB in edit mode unless changed)
    // We need to be careful not to overwrite DB values on first render of edit mode unless we specifically want to recalculate.
    // For now, let's keep the logic but maybe guard it? Actually, if dates are present, recalculating nights matches expectation.
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

    // ✅ Price Calculation
    // In edit mode, we might want to allow manual override? Or stick to formula?
    // Requirement says "Editable form". Usually price is auto-calculated.
    // ✅ Price Calculation
    // In edit mode, we might want to allow manual override? Or stick to formula?
    // Requirement says "Editable form". Usually price is auto-calculated.
    useEffect(() => {
        const basePrice = ROOM_PRICES[formData.roomType] || 6500; // Fallback to base price
        const rooms = Number(formData.noOfRooms) || 1; // Default to 1 if 0/NaN
        const nights = Number(formData.noOfNights) || 1; // Default to 1 if 0/NaN

        const total = basePrice * rooms * nights;

        // Update price as string
        setFormData(prev => ({ ...prev, price: String(total) }));

    }, [formData.roomType, formData.noOfRooms, formData.noOfNights]);

    // ✅ Pending Amount Calculation
    // ✅ Pending Amount Calculation
    useEffect(() => {
        // Safe Parse
        const p = Number(formData.price) || 0;
        const a = Number(formData.advanceAmount) || 0;

        setFormData(prev => ({
            ...prev,
            pendingAmount: p - a
        }));
    }, [formData.price, formData.advanceAmount]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            let newVal: any = value;

            // Handle Numeric Fields: Rooms, Nights, Price, Advance
            if (['noOfRooms', 'noOfNights', 'price', 'advanceAmount'].includes(name)) {
                if (value === '' || /^[0-9]+$/.test(value)) {
                    // Remove leading zero if length > 1
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

            return { ...prev, [name]: newVal };
        });
    };

    const handleGuestChange = (type: 'adults' | 'children', value: string) => {
        if (value === '' || /^[0-9]+$/.test(value)) {
            let newVal = value;
            if (newVal.length > 1 && newVal.startsWith('0')) {
                newVal = newVal.replace(/^0+/, '');
                if (newVal === '') newVal = '0';
            }

            setFormData(prev => ({
                ...prev,
                guests: {
                    ...prev.guests,
                    [type]: newVal
                }
            }));
        }
    };

    const handleMealToggle = (plan: string) => {
        setFormData(prev => {
            const current = prev.mealPlan;
            const updated = current.includes(plan)
                ? current.filter(p => p !== plan)
                : [...current, plan];
            return { ...prev, mealPlan: updated };
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode && bookingId) {
                // UPDATE EXISTING BOOKING
                const finalPayload = {
                    ...formData,
                    // Convert all strings to numbers for backend
                    guests: {
                        adults: Number(formData.guests.adults || 0),
                        children: Number(formData.guests.children || 0)
                    },
                    noOfRooms: Number(formData.noOfRooms || 1),
                    noOfNights: Number(formData.noOfNights || 1),
                    totalAmount: Number(formData.price || 0),
                    advanceAmount: Number(formData.advanceAmount || 0),
                    pendingAmount: Number(formData.pendingAmount || 0)
                };

                await api.put(`/api/booking/${bookingId}`, finalPayload);
                alert("Booking Updated Successfully!");
                router.push('/history');
            } else {
                // CREATE NEW BOOKING & GENERATE PDF
                const createPayload = {
                    ...formData,
                    guests: {
                        adults: Number(formData.guests.adults || 0),
                        children: Number(formData.guests.children || 0)
                    },
                    noOfRooms: Number(formData.noOfRooms || 1),
                    noOfNights: Number(formData.noOfNights || 1),
                    price: Number(formData.price || 0),
                    advanceAmount: Number(formData.advanceAmount || 0),
                    pendingAmount: Number(formData.pendingAmount || 0)
                };

                const res = await api.post('/api/generate-pdf', createPayload, {
                    responseType: 'blob'
                });

                // Download PDF
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `booking_${formData.guestName.replace(/\s+/g, '_')}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();

                // Redirect
                const newBookingId = res.headers['x-booking-id'];
                if (newBookingId) {
                    setTimeout(() => router.push(`/booking/${newBookingId}`), 1000);
                }
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
                <Button
                    variant="secondary"
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-sm"
                >
                    Create New
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => router.push('/history')}
                    className="flex items-center gap-2 text-sm"
                >
                    <History className="w-4 h-4" /> View History
                </Button>
            </div>

            <Card className="w-full max-w-4xl mx-auto" title={isEditMode ? `Edit Booking: ${bookingId}` : "New Booking Entry"}>
                <form onSubmit={handleFormSubmit} className="space-y-6">

                    {/* Section 1: Guest Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Guest Name"
                            name="guestName"
                            value={formData.guestName}
                            onChange={handleChange}
                            placeholder="Enter Full Name"
                            required
                        />
                        <Input
                            label="Phone Number"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                            required
                        />
                    </div>

                    {/* Section 2: Stay Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Input
                            label="Check-In"
                            type="date"
                            name="checkIn"
                            value={formData.checkIn}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Check-Out"
                            type="date"
                            name="checkOut"
                            value={formData.checkOut}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Nights"
                            type="text"
                            inputMode="numeric"
                            name="noOfNights"
                            value={formData.noOfNights}
                            onChange={handleChange}
                        />
                        <Input
                            label="Adults"
                            type="text"
                            inputMode="numeric"
                            name="adults"
                            value={formData.guests.adults}
                            onChange={(e) => handleGuestChange('adults', e.target.value)}
                            required
                        />
                        <Input
                            label="Children"
                            type="text"
                            inputMode="numeric"
                            name="children"
                            value={formData.guests.children}
                            onChange={(e) => handleGuestChange('children', e.target.value)}
                        />
                    </div>

                    {/* Section 3: Room & Meals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Select
                                label="Room Type"
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleChange}
                                options={Object.keys(ROOM_PRICES).map(r => ({ value: r, label: r }))}
                            />
                            <div className="mt-4 flex items-center gap-4">
                                <Input
                                    label="No. of Rooms"
                                    type="text"
                                    inputMode="numeric"
                                    name="noOfRooms"
                                    value={formData.noOfRooms}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

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
                    </div>

                    {/* Section 4: Payment */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Payment & Status Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <Select
                                label="Booking Status"
                                name="bookingStatus"
                                value={formData.bookingStatus}
                                onChange={handleChange}
                                options={BOOKING_STATUSES}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input
                                label="Total Amount (₹)"
                                type="text"
                                inputMode="numeric"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
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
                                type="number"
                                name="pendingAmount"
                                value={formData.pendingAmount}
                                onChange={handleChange}
                                disabled // Auto-calculated
                                className="bg-gray-100"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row justify-end gap-3">
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleDownloadPDF}
                                isLoading={downloadingPdf}
                                className="flex items-center gap-2"
                            >
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
