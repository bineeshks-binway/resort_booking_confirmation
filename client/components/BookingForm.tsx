"use client";

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Card } from './Card';
import { ArrowRight, Download, Calculator, History } from 'lucide-react'; // Added History icon
import api from '@/lib/api'; // Import centralized API
import { useRouter } from 'next/navigation'; // Added useRouter

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

export const BookingForm = () => {
    const router = useRouter(); // router instance
    const [formData, setFormData] = useState({
        guestName: '',
        phoneNumber: '+91 ',
        checkIn: '',
        checkOut: '',
        guests: 2, // No. of Persons
        roomType: 'Nalukettu',
        noOfRooms: 1,
        noOfNights: 1,
        mealPlan: [] as string[],
        price: 6500, // Total Amount
        advanceAmount: 0,
        pendingAmount: 6500,
        bookingId: '',
        bookingStatus: 'CONFIRMED'
    });

    const [loading, setLoading] = useState(false);

    // ✅ Auto Calculation Logic
    useEffect(() => {
        // Calculate No. of Nights
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0 && diffDays !== formData.noOfNights) {
                setFormData(prev => ({ ...prev, noOfNights: diffDays }));
            }
        }
    }, [formData.checkIn, formData.checkOut]);

    // ✅ Price Calculation
    useEffect(() => {
        const basePrice = ROOM_PRICES[formData.roomType] || 0;
        const total = basePrice * formData.noOfRooms * formData.noOfNights;

        setFormData(prev => {
            return { ...prev, price: total };
        });

    }, [formData.roomType, formData.noOfRooms, formData.noOfNights]);

    // ✅ Pending Amount Calculation
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            pendingAmount: prev.price - prev.advanceAmount
        }));
    }, [formData.price, formData.advanceAmount]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            let newVal: any = value;
            if (['guests', 'noOfRooms', 'noOfNights', 'price', 'advanceAmount'].includes(name)) {
                newVal = parseFloat(value) || 0;
            }
            return { ...prev, [name]: newVal };
        });
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

    const handleGeneratePDF = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Updated to use centralized API client
            const res = await api.post('/generate-pdf', formData, {
                responseType: 'blob'
            });

            // 1. Download PDF
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking_${formData.guestName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // 2. Redirect to Booking Details Page
            // Read ID from header (ensure lowercase for axios/CORS compatibility)
            const bookingId = res.headers['x-booking-id'];
            if (bookingId) {
                // Short delay to allow download to start
                setTimeout(() => {
                    router.push(`/booking/${bookingId}`);
                }, 1000);
            }

        } catch (error: any) {
            console.error("PDF Generation failed", error);
            let message = error.message;
            const status = error.response?.status;

            if (error.response?.data instanceof Blob) {
                // Parse Blob error response
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    message = json.message || json.error || message;
                    if (json.error) message += ` (${json.error})`;
                } catch (e) {
                    // Fallback if not JSON
                    message = "Server Error (Check logs)";
                }
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            alert(`Failed to generate PDF. Error: ${status || 'Network'} - ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button
                    variant="secondary"
                    onClick={() => router.push('/history')}
                    className="flex items-center gap-2 text-sm"
                >
                    <History className="w-4 h-4" /> View Booking History
                </Button>
            </div>

            <Card className="w-full max-w-4xl mx-auto" title="New Booking Entry">
                <form onSubmit={handleGeneratePDF} className="space-y-6">

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
                            type="number"
                            name="noOfNights"
                            value={formData.noOfNights}
                            onChange={handleChange}
                            min={1}
                        />
                        <Input
                            label="Persons"
                            type="number"
                            name="guests"
                            value={formData.guests}
                            onChange={handleChange}
                            min={1}
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
                                    type="number"
                                    name="noOfRooms"
                                    value={formData.noOfRooms}
                                    onChange={handleChange}
                                    min={1}
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
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                            />
                            <Input
                                label="Advance Paid (₹)"
                                type="number"
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

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="submit" isLoading={loading} className="w-full md:w-auto flex items-center gap-2">
                            <Download className="w-4 h-4" /> Generate PDF & Create Booking
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
