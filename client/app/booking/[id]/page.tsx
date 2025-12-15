"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Download, Copy, ArrowLeft, Building2, Calendar, Users, Utensils, CreditCard } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function BookingDetailsPage() {
    const params = useParams(); // { id: 'WFR...' }
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchBookingDetails();
        }
    }, [params.id]);

    const fetchBookingDetails = async () => {
        try {
            const res = await api.get(`/api/booking/${params.id}`);
            setBooking(res.data);
        } catch (error) {
            console.error("Error fetching booking details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        // Since we don't have a direct "re-generate" endpoint yet, we create one logic.
        // Or we can simple hit generate-pdf with existing data but that would CREATE a new booking ID if we aren't careful.
        // Wait, the generate-pdf endpoint generates a NEW ID. We need a way to just get the PDF.
        // For now, I'll assume I need to implement `POST /re-generate-pdf` or `GET /booking/:id/pdf`.
        // I will implement `GET /booking/:id/pdf` in the backend shortly.
        // For this frontend code, I'll point to that endpoint.

        setPdfLoading(true);
        try {
            const response = await api.get(`/api/booking/${booking.bookingId}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking_${booking.guestName.replace(/\s+/g, '_')}_${booking.bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("PDF Download failed", error);
            alert("Failed to download PDF. Backend support might be pending.");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDuplicate = () => {
        // Serialize data and pass to main form via query params or context? 
        // Or just redirect to /booking with pre-filled state?
        // Simplest: Redirect to home (/) and maybe use localStorage to hydrate form?
        // For now, let's just go home. Implementing full hydration is complex without context.
        router.push('/');
    };

    if (loading) return <div className="flex justify-center p-20 text-gray-500">Loading details...</div>;
    if (!booking) return <div className="p-20 text-center text-red-500">Booking not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.push('/history')} className="flex items-center text-gray-500 mb-6 hover:text-gray-800 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
                </button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="text-orange-600">{booking.bookingId}</span>
                            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full border border-green-200">Confirmed</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleDuplicate} variant="secondary" className="flex gap-2">
                            <Copy className="w-4 h-4" /> Duplicate
                        </Button>
                        <Button onClick={handleDownloadPDF} isLoading={pdfLoading} className="flex gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Guest & Room */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Guest & Stay</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-gray-500">Guest Name</label>
                                    <div className="font-semibold text-lg">{booking.guestName}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Phone</label>
                                    <div className="font-semibold text-lg">{booking.phoneNumber}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Check-in</label>
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        {new Date(booking.checkIn).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Check-out</label>
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-red-500" />
                                        {new Date(booking.checkOut).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Room Details */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Room Info</h2>
                            <div className="flex gap-4 items-start">
                                {/* Room Image Preview - Using logic similar to backend or just static generic if not stored fully (but backend stores path) */}
                                {/* The backend stores 'roomImage' as "rooms/studio.png". We need to serve this publically or map it. 
                                    The server serves /public via express static. 
                                    So src should be http://localhost:5000/public/images/rooms/studio.png 
                                    Wait, the backend `roomImage` field stores "rooms/nalukettu.png". 
                                */}
                                <div className="w-24 h-24 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/${booking.roomImage || 'room.webp'}`}
                                        className="w-full h-full object-cover"
                                        alt="Room"
                                        onError={(e) => (e.currentTarget.src = '/room-placeholder.jpg')}
                                    />
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Room Type</label>
                                        <div className="font-bold text-gray-800">{booking.roomType}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Config</label>
                                        <div className="font-medium text-gray-600">{booking.noOfRooms} Room(s), {booking.noOfNights} Night(s)</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Guests</label>
                                        <div className="font-medium text-gray-600 flex items-center gap-1">
                                            <Users className="w-4 h-4" /> {booking.guests}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Meal Plan</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {booking.mealPlan && booking.mealPlan.length > 0 ? (
                                                booking.mealPlan.map((m: string) => (
                                                    <span key={m} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 uppercase font-bold">
                                                        {m}
                                                    </span>
                                                ))
                                            ) : <span className="text-gray-400 italic text-sm">None</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Column */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Payment</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Amount</span>
                                    <span className="font-bold text-gray-800">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Advance</span>
                                    <span className="font-bold text-green-600">- ₹{booking.advanceAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="pt-3 border-t flex justify-between text-lg font-bold text-red-600">
                                    <span>Pending</span>
                                    <span>₹{booking.pendingAmount.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 text-xs text-gray-500 space-y-2 border">
                            <p><strong>Bank:</strong> Axis Bank</p>
                            <p><strong>Account:</strong> 917020051575330</p>
                            <p><strong>IFSC:</strong> UTIB0001099</p>
                            <p><strong>Branch:</strong> Sulthan Bathery</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
