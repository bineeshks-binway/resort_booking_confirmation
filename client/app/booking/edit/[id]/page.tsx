"use client";

import React, { useEffect, useState } from 'react';
import { BookingForm } from '@/components/BookingForm';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function EditBookingPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const [bookingData, setBookingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            const res = await api.get(`/api/booking/${bookingId}`);
            setBookingData(res.data);
        } catch (error) {
            console.error("Failed to fetch booking:", error);
            alert("Failed to load booking details.");
            router.push('/history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg animate-pulse">Loading booking details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-emerald-50/30 p-6 md:p-10">
            <div className="max-w-4xl mx-auto mb-6">
                <button
                    onClick={() => router.push('/history')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to History
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Booking: <span className="text-orange-600">{bookingData?.bookingId}</span></h1>
                <p className="text-gray-500 text-sm mb-6">Modify details below. Booking ID cannot be changed.</p>

                {bookingData && (
                    <BookingForm
                        initialData={bookingData}
                        isEditMode={true}
                        bookingId={bookingData.bookingId}
                    />
                )}
            </div>
        </div>
    );
}
