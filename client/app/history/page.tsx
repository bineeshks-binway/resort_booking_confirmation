"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, Calendar, ChevronRight, Home, Edit, Download, Eye } from 'lucide-react';

// Define Booking Type
interface Booking {
    _id: string;
    bookingId: string;
    guestName: string;
    phoneNumber: string;
    checkIn: string;
    checkOut: string;
    guests: number | { adults: number; children: number };
    roomType: string;
    totalAmount: number;
    createdAt: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

    const handleDownloadPDF = async (e: React.MouseEvent, booking: Booking) => {
        e.stopPropagation(); // Prevent row click
        setDownloadingId(booking.bookingId);
        try {
            const res = await api.get(`/api/booking/${booking.bookingId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking_${booking.guestName.replace(/\s+/g, '_')}_${booking.bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("PDF Download failed", error);
            alert("Failed to download PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleEdit = (e: React.MouseEvent, bookingId: string) => {
        e.stopPropagation();
        router.push(`/booking/edit/${bookingId}`);
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

                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center text-gray-600 hover:text-green-700 transition font-medium"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Back to New Booking
                    </button>
                </div>

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
                                                        <th className="p-4">Booking ID</th>
                                                        <th className="p-4">Guest Name</th>
                                                        <th className="p-4">Dates</th>
                                                        <th className="p-4">Room</th>
                                                        <th className="p-4 text-right">Amount</th>
                                                        <th className="p-4 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {groupedBookings[date].map((booking, index) => (
                                                        <tr
                                                            key={booking._id}
                                                            onClick={() => router.push(`/booking/${booking.bookingId}`)}
                                                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                                                        >
                                                            <td className="p-4 font-bold text-orange-600 whitespace-nowrap">{booking.bookingId}</td>
                                                            <td className="p-4 font-medium text-gray-900">{booking.guestName}</td>
                                                            <td className="p-4 whitespace-nowrap">
                                                                <div className="text-xs text-gray-500">In: {new Date(booking.checkIn).toLocaleDateString('en-GB')}</div>
                                                                <div className="text-xs text-gray-500">Out: {new Date(booking.checkOut).toLocaleDateString('en-GB')}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-semibold border border-green-200">
                                                                    {booking.roomType}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-gray-800">
                                                                ₹{booking.totalAmount.toLocaleString('en-IN')}
                                                            </td>
                                                            <td className="p-4 flex justify-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleEdit(e, booking.bookingId)}
                                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                    title="Edit Booking"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDownloadPDF(e, booking)}
                                                                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                                                    title="Download PDF"
                                                                    disabled={downloadingId === booking.bookingId}
                                                                >
                                                                    {downloadingId === booking.bookingId ? (
                                                                        <span className="animate-spin">⌛</span>
                                                                    ) : (
                                                                        <Download className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push(`/booking/${booking.bookingId}`);
                                                                    }}
                                                                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors block md:hidden"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
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
