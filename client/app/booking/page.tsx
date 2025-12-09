"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ArrowRight, Hotel } from 'lucide-react';

export default function BookingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        guestName: '',
        phoneNumber: '+91 ',
        checkIn: '',
        checkOut: '',
        guests: 2,
        roomType: 'Deluxe',
        price: 0,
        paymentStatus: 'Pending',
        extraServices: [] as string[],
        specialNotes: '',
        whatsappNumber: ''
    });

    const [loading, setLoading] = useState(false);

    // Auto-calculate price based on simple logic (can be overridden)
    useEffect(() => {
        // Only auto-calc if price is 0 (initial) or user wants it
        if (formData.price === 0) {
            const prices: Record<string, number> = { 'Deluxe': 4500, 'Premium': 6500, 'Suite': 12000 };
            const basePrice = prices[formData.roomType] || 4500;
            setFormData(prev => ({ ...prev, price: basePrice }));
        }
    }, [formData.roomType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'guestName') {
            // Capitalize first letter of each word
            const capitalizedValue = value.replace(/\b\w/g, char => char.toUpperCase());
            setFormData(prev => ({ ...prev, [name]: capitalizedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (service: string) => {
        setFormData(prev => {
            const services = prev.extraServices.includes(service)
                ? prev.extraServices.filter(s => s !== service)
                : [...prev.extraServices, service];
            return { ...prev, extraServices: services };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // basic validation
        if (!formData.guestName || !formData.phoneNumber) {
            alert("Please fill in required fields");
            setLoading(false);
            return;
        }

        // Save to local storage for preview
        localStorage.setItem('bookingData', JSON.stringify(formData));
        router.push('/preview');
    };

    const services = ['Breakfast', 'Jeep Safari', 'Candle Light Dinner', 'Campfire', 'Spa'];

    return (
        <div className="min-h-screen py-10 px-4 flex justify-center items-start bg-gray-50">
            <Card className="w-full max-w-2xl" title="New Booking Entry">
                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="No. of Guests"
                            type="number"
                            name="guests"
                            value={formData.guests}
                            onChange={handleChange}
                            min={1}
                        />
                        <Select
                            label="Room Type"
                            name="roomType"
                            value={formData.roomType}
                            onChange={handleChange}
                            options={[
                                { value: 'Deluxe', label: 'Deluxe Room' },
                                { value: 'Premium', label: 'Premium Room' },
                                { value: 'Suite', label: 'Luxury Suite' }
                            ]}
                        />
                        <Select
                            label="Payment Status"
                            name="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleChange}
                            options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Paid', label: 'Paid' },
                                { value: 'Advance Paid', label: 'Advance Paid' }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <Input
                            label="Total Price (₹)"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                        />

                        <Input
                            label="WhatsApp (for PDF)"
                            name="whatsappNumber"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                            placeholder="Number to send PDF to"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Extra Services</label>
                        <div className="flex flex-wrap gap-3">
                            {services.map(service => (
                                <button
                                    key={service}
                                    type="button"
                                    onClick={() => handleCheckboxChange(service)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.extraServices.includes(service)
                                        ? 'bg-green text-white border-green'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-green'
                                        }`}
                                >
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Special Notes</label>
                        <textarea
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green focus:border-transparent outline-none"
                            rows={3}
                            name="specialNotes"
                            value={formData.specialNotes}
                            onChange={handleChange}
                            placeholder="Any special requests..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" isLoading={loading} className="w-full md:w-auto">
                            Generate Preview <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Decorative Resort branding footer */}
            <div className="fixed bottom-0 left-0 w-full p-4 text-center text-gray-400 text-xs pointer-events-none">
                <div className="flex items-center justify-center gap-2">
                    <Hotel className="w-4 h-4" /> Wayanad Green Valley Resort Internal Tool
                </div>
            </div>
        </div>
    );
}
