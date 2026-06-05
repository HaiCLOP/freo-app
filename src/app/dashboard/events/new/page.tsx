"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, IndianRupee, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createEvent } from "../actions";

export default function NewEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create New Event</h1>
          <p className="text-gray-500">Set up the details for your upcoming event.</p>
        </div>
      </div>

      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          try {
            await createEvent(formData);
          } catch (e) {
            console.error(e);
            setIsSubmitting(false);
          }
        }} 
        className="space-y-6"
      >
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>This information will be displayed publicly on the registration page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" name="name" placeholder="e.g. Annual Business Seminar" required className="rounded-xl bg-gray-50/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Tell your attendees what this event is about..." 
                required 
                className="rounded-xl bg-gray-50/50 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input id="date" name="date" type="datetime-local" required className="rounded-xl bg-gray-50/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue Location</Label>
                <Input id="venue" name="venue" placeholder="e.g. Radisson Blu, Guwahati" required className="rounded-xl bg-gray-50/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price (INR)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input id="price" name="price" type="number" min="0" step="1" placeholder="500" required className="pl-9 rounded-xl bg-gray-50/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Maximum Capacity</Label>
                <Input id="max_capacity" name="max_capacity" type="number" min="1" placeholder="100" required className="rounded-xl bg-gray-50/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner">Event Banner Image</Label>
              <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${bannerFile ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                {bannerFile ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
                    <p className="text-sm font-medium text-gray-900 line-clamp-1 px-4">{bannerFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Click to upload banner</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG or WebP (Max 5MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  id="banner" 
                  name="banner" 
                  accept="image/*" 
                  className="opacity-0 absolute inset-0 cursor-pointer" 
                  required 
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>Set up where attendees will send their payments via UPI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="upi_id">Your UPI ID</Label>
              <Input id="upi_id" name="upi_id" placeholder="e.g. john@okaxis" required className="rounded-xl bg-gray-50/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi_qr">UPI QR Code Image</Label>
              <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${qrFile ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                {qrFile ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
                    <p className="text-sm font-medium text-gray-900 line-clamp-1 px-4">{qrFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Upload QR Code</p>
                    <p className="text-xs text-gray-500 mt-1">Make sure it's clear and scannable</p>
                  </>
                )}
                <input 
                  type="file" 
                  id="upi_qr" 
                  name="upi_qr" 
                  accept="image/*" 
                  className="opacity-0 absolute inset-0 cursor-pointer" 
                  required 
                  onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-900">Google Sheets Integration</CardTitle>
            <CardDescription className="text-blue-700/80">
              Because of your Google Cloud tier, you must manually create a spreadsheet. 
              <br/>1. Create a blank Google Sheet.
              <br/>2. Share it as an <b>Editor</b> with this exact email: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs select-all">events@gen-lang-client-0206974056.iam.gserviceaccount.com</code>
              <br/>3. Paste the link to your spreadsheet below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="google_sheet_url" className="text-blue-900">Google Sheet URL</Label>
              <Input 
                id="google_sheet_url" 
                name="google_sheet_url" 
                placeholder="https://docs.google.com/spreadsheets/d/1A2B3C4D5E..." 
                required 
                className="rounded-xl bg-white border-blue-200 focus-visible:ring-blue-500" 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl h-11 px-6">Cancel</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#1d1d1f] hover:bg-[#2A2B31] text-[#DDFE55] font-semibold border border-[#1d1d1f] rounded-xl h-11 px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Event...
              </>
            ) : (
              "Save & Continue to Form Builder"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
