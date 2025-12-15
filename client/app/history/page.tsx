"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, Calendar, ChevronRight } from 'lucide-react';

// Define Booking Type
interface Booking {
    _id: string;
    bookingId: string;
    guestName: string;
    phoneNumber: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomType: string;
    totalAmount: number;
    createdAt: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Search Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/api/history');
            setBookings(res.data);
            setFilteredBookings(res.data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Search & Filter
    useEffect(() => {
        let result = bookings;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(b =>
                b.guestName.toLowerCase().includes(lowerTerm) ||
                b.bookingId.toLowerCase().includes(lowerTerm)
            );
        }

        if (dateFilter) {
            // Filter by Created At Date
            result = result.filter(b =>
                new Date(b.createdAt).toISOString().split('T')[0] === dateFilter
            );
        }

        setFilteredBookings(result);
    }, [searchTerm, dateFilter, bookings]);

    // Group bookings by Date (YYYY-MM-DD -> 10 August 2025)
    const groupedBookings = filteredBookings.reduce((acc, booking) => {
        const date = new Date(booking.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Booking History</h1>

                    {/* Search Controls */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Name or ID..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none w-full md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-20 text-gray-500">Loading history...</div>
                ) : (
                    <div className="space-y-8">
                        {Object.keys(groupedBookings).length === 0 ? (
                            <div className="text-center p-10 bg-white rounded-lg shadow text-gray-500">
                                No bookings found matching your criteria.
                            </div>
                        ) : (
                            Object.keys(groupedBookings).map(date => (
                                <div key={date}>
                                    <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                        📅 {date}
                                    </h3>
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-600">
                                                <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                                                    <tr>
                                                        <th className="p-4">#</th>
                                                        <th className="p-4">Booking ID</th>
                                                        <th className="p-4">Guest Name</th>
                                                        <th className="p-4">Guests</th>
                                                        <th className="p-4">Check-in</th>
                                                        <th className="p-4">Check-out</th>
                                                        <th className="p-4">Room</th>
                                                        <th className="p-4 text-right">Amount</th>
                                                        <th className="p-4"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {groupedBookings[date].map((booking, index) => (
                                                        <tr
                                                            key={booking._id}
                                                            onClick={() => router.push(`/booking/${booking.bookingId}`)}
                                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <td className="p-4 text-gray-400">{index + 1}</td>
                                                            <td className="p-4 font-bold text-orange-600">{booking.bookingId}</td>
                                                            <td className="p-4 font-medium text-gray-900">{booking.guestName}</td>
                                                            <td className="p-4">{booking.guests}</td>
                                                            <td className="p-4">{new Date(booking.checkIn).toLocaleDateString('en-GB')}</td>
                                                            <td className="p-4">{new Date(booking.checkOut).toLocaleDateString('en-GB')}</td>
                                                            <td className="p-4">
                                                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-semibold border border-green-200">
                                                                    {booking.roomType}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-gray-800">
                                                                ₹{booking.totalAmount.toLocaleString('en-IN')}
                                                            </td>
                                                            <td className="p-4 text-gray-400">
                                                                <ChevronRight className="w-4 h-4" />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
