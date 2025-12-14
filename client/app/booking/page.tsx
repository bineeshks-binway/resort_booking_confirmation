"use client";

import React from 'react';
import { BookingForm } from '@/components/BookingForm';
import { Hotel } from 'lucide-react';

export default function BookingPage() {
    return (
        <div className="min-h-screen py-10 px-4 flex justify-center items-start bg-gray-50">
            <BookingForm />

            {/* Decorative Resort branding footer */}
            <div className="fixed bottom-0 left-0 w-full p-4 text-center text-gray-400 text-xs pointer-events-none">
                <div className="flex items-center justify-center gap-2">
                    <Hotel className="w-4 h-4" /> Wayanad Fort Resort Internal Tool
                </div>
            </div>
        </div>
    );
}
