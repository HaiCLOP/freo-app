"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, IndianRupee, Image as ImageIcon, CheckCircle2, Clock, Users } from "lucide-react";
import Link from "next/link";
import { createEvent } from "../actions";

export default function NewEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [capacity, setCapacity] = useState<number>(0);
  const [phaseEnabled, setPhaseEnabled] = useState(false);

  const showPhaseOption = capacity > 100;

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

      {/* Full-page loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#1d1d1f]" />
            <div className="text-center">
              <p className="font-semibold text-[#1d1d1f] text-lg">Creating Your Event...</p>
              <p className="text-sm text-[#86868b] mt-1">Uploading images and setting up your Google Sheet.</p>
            </div>
          </div>
        </div>
      )}

      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          try {
            await createEvent(formData);
          } catch (e: any) {
            // Don't catch Next.js redirect errors — let them propagate
            if (e?.digest?.startsWith('NEXT_REDIRECT')) {
              throw e;
            }
            console.error(e);
            setIsSubmitting(false);
          }
        }} 
        className={`space-y-6 ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
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
                <Input 
                  id="max_capacity" 
                  name="max_capacity" 
                  type="number" 
                  min="1" 
                  placeholder="100" 
                  required 
                  className="rounded-xl bg-gray-50/50" 
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCapacity(isNaN(val) ? 0 : val);
                    // Auto-enable phase registration for large events
                    if (val > 100) {
                      setPhaseEnabled(true);
                    } else {
                      setPhaseEnabled(false);
                    }
                  }}
                />
              </div>
            </div>

            {/* Phase-wise Registration — shown when capacity > 100 */}
            {showPhaseOption && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 text-[15px]">Phase-wise Registration Recommended</h4>
                      <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                        Your event has <strong>{capacity}</strong> seats. To ensure every attendee gets their confirmation 
                        email reliably, we recommend opening registration in daily phases of <strong>100 registrations per day</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Enable Phase-wise Registration</p>
                        <p className="text-xs text-gray-500">Limit to 100 registrations per day</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="phase_registration"
                        value="on"
                        checked={phaseEnabled}
                        onChange={(e) => setPhaseEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {phaseEnabled && (
                    <div className="animate-in fade-in duration-200 bg-white rounded-xl p-4 border border-amber-100 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-amber-800">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        <span>Registration will open in phases:</span>
                      </div>
                      <div className="text-xs text-amber-700/80 space-y-1 pl-6">
                        <p>• Day 1: Registrations 1–100</p>
                        <p>• Day 2: Registrations 101–200</p>
                        <p>• ... and so on until all {capacity} seats are filled</p>
                        <p className="font-medium mt-2">Total phases: {Math.ceil(capacity / 100)} days</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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

        <Card className="rounded-2xl border-gray-100 shadow-sm border-green-100 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Google Sheets Integration
            </CardTitle>
            <CardDescription className="text-green-700/80">
              A registration spreadsheet will be <b>automatically created</b> in your Google Drive when you create this event.
              All registrations, approvals, and rejections will sync in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-xl p-4 border border-green-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-green-900">Powered by your Google Account</p>
                <p className="text-green-700/70 text-xs mt-1">
                  Not connected yet? Go to <a href="/dashboard/settings" className="underline font-medium">Settings</a> to connect your Google account first.
                </p>
              </div>
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
