"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ArrowLeft, Download, Share2, Printer, CheckCircle } from 'lucide-react';

export default function PreviewPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        const savedData = localStorage.getItem('bookingData');
        if (!savedData) {
            router.push('/booking');
            return;
        }
        setData(JSON.parse(savedData));
    }, [router]);

    const handleGeneratePDF = async () => {
        if (!data) return;
        setGenerating(true);
        try {
            const response = await axios.post('http://localhost:5000/api/generate-pdf', data, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Booking_${data.guestName}.pdf`);
            document.body.appendChild(link);
            link.click();

            setDownloadUrl(url); // Keep for sharing?
        } catch (error) {
            console.error("PDF Fail", error);
            alert("Failed to generate PDF. Is the backend running?");
        } finally {
            setGenerating(false);
        }
    };

    const handleWhatsApp = () => {
        if (!data?.whatsappNumber) {
            alert("No WhatsApp number provided");
            return;
        }
        const message = `High Greetings from Wayanad Green Valley Resort!\n\nDear ${data.guestName},\nYour booking is confirmed. Please find your booking details attached (sent separately). We look forward to hosting you on ${data.checkIn}.`;
        const url = `https://wa.me/${data.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (!data) return <div className="min-h-screen flex items-center justify-center">Loading Preview...</div>;

    return (
        <div className="min-h-screen py-10 px-4 bg-gray-100 flex flex-col items-center">
            <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                <Button variant="secondary" onClick={() => router.push('/booking')} className="!bg-white !text-gray-700 !shadow-sm border">
                    <ArrowLeft className="w-4 h-4" /> Edit Details
                </Button>
                <h1 className="text-2xl font-display font-bold text-gray-800">Booking Preview</h1>
                <div className="hidden md:block w-32"></div> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-4xl">
                {/* LEFT: Preview Card (Visualizing what PDF looks like roughly) */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-2xl rounded-sm overflow-hidden border-t-8 border-green relative min-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="bg-green p-8 text-center text-gold">
                            {/* Mock Logo */}
                            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="text-green text-2xl font-serif font-bold">W</span>
                            </div>
                            <h2 className="text-2xl font-display font-bold tracking-wider">WAYANAD GREEN VALLEY</h2>
                            <p className="text-xs text-white/80 mt-1 uppercase tracking-widest">Luxury Resort & Spa</p>
                        </div>

                        <div className="p-8 flex-grow">
                            <div className="flex justify-between border-b pb-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Booking Confirmation</h3>
                                    <p className="text-sm text-gray-500">ID: #RES-{new Date().getTime().toString().slice(-6)}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${data.paymentStatus === 'Paid' ? 'bg-green-100 text-green' : 'bg-red-100 text-red-700'}`}>
                                        {data.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Guest Info */}
                            <div className="grid grid-cols-2 gap-y-4 text-sm mb-8">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Guest Name</p>
                                    <p className="font-semibold">{data.guestName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Phone</p>
                                    <p className="font-semibold">{data.phoneNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Check-In</p>
                                    <p className="font-semibold">{data.checkIn}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Check-Out</p>
                                    <p className="font-semibold">{data.checkOut}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Room Type</p>
                                    <p className="font-semibold text-green">{data.roomType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Guests</p>
                                    <p className="font-semibold">{data.guests}</p>
                                </div>
                            </div>

                            {/* Price Box */}
                            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gold flex justify-between items-center">
                                <span className="font-bold text-gray-700">Total Amount</span>
                                <span className="font-display text-2xl font-bold text-gold">₹ {data.price}</span>
                            </div>
                        </div>

                        <div className="bg-gray-100 p-4 text-center text-xs text-gray-500 border-t">
                            This is a preview. The actual PDF will contain full branding, images, and maps.
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="lg:col-span-1 space-y-4">
                    <Card title="Actions" className="sticky top-8">
                        <div className="space-y-3">
                            <Button onClick={handleGeneratePDF} isLoading={generating} className="w-full justify-between group">
                                Download PDF <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                            </Button>
                            <Button variant="secondary" onClick={handleWhatsApp} className="w-full justify-between bg-green-600 hover:bg-green-700 text-white !bg-[#25D366]">
                                Share on WhatsApp <Share2 className="w-4 h-4" />
                            </Button>
                            {downloadUrl && (
                                <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-lg flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> PDF Ready!
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Debug Info</h4>
                        <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
