export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, HardDrive, Sheet, ShieldCheck, Unlink } from "lucide-react";
import Link from "next/link";
import { connectGoogleAccount, disconnectGoogleAccount, updateCreatorName } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string, error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("name, email, google_access_token, google_refresh_token, google_drive_folder_id, google_token_updated_at")
    .eq("id", user.id)
    .single();

  const isGoogleConnected = !!creator?.google_access_token;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#f5f5f7]">
            <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">Settings</h1>
          <p className="text-[#86868b] mt-1 text-lg font-medium">Manage your account and integrations.</p>
        </div>
      </div>

      {/* Status Messages */}
      {resolvedSearchParams.success === "google_disconnected" && (
        <div className="bg-green-50 text-green-700 text-sm p-4 rounded-xl border border-green-100 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          Google account disconnected successfully.
        </div>
      )}
      {resolvedSearchParams.error === "google_connect_failed" && (
        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Failed to connect Google account. Please try again.
        </div>
      )}

      {/* Account Info */}
      <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Account</CardTitle>
          <CardDescription>Your Freo creator account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#f5f5f7]">
              <div className="w-full">
                <form action={updateCreatorName} className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[#86868b] block mb-2">Name</span>
                    <Input id="name" name="name" defaultValue={creator?.name} required className="rounded-xl bg-gray-50/50 max-w-sm" />
                  </div>
                  <div className="mt-7">
                    <SubmitButton text="Save Name" />
                  </div>
                </form>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-[#86868b]">Email</span>
              <span className="text-sm font-semibold text-[#1d1d1f]">{creator?.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Integration */}
      <Card className={`rounded-[24px] border shadow-sm transition-all ${isGoogleConnected ? 'border-green-200 bg-green-50/30' : 'border-[#f5f5f7]'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Account
              </CardTitle>
              <CardDescription className="mt-1">
                Connect your Google account to store event images in your Google Drive and auto-sync registrations to Sheets.
              </CardDescription>
            </div>
            {isGoogleConnected && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isGoogleConnected ? (
            <>
              {/* Connected state */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-green-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1d1d1f]">Google Drive</p>
                        <p className="text-xs text-green-600 font-medium">Active</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#86868b] leading-relaxed">
                      Event banners, QR codes, and payment screenshots are stored in your Drive under <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">Freo Events/</code>
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-green-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Sheet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1d1d1f]">Google Sheets</p>
                        <p className="text-xs text-green-600 font-medium">Active</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#86868b] leading-relaxed">
                      Registrations are synced to your linked Google Sheets automatically.
                    </p>
                  </div>
                </div>

                {creator?.google_token_updated_at && (
                  <p className="text-xs text-[#86868b] text-center">
                    Last synced: {new Date(creator.google_token_updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>

              <div className="border-t border-green-100 pt-4">
                <form action={disconnectGoogleAccount}>
                  <SubmitButton
                    variant="outline"
                    className="rounded-full h-11 px-6 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium transition-all"
                    pendingText="Disconnecting..."
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect Google Account
                  </SubmitButton>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="bg-[#f5f5f7] rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck className="w-6 h-6 text-[#86868b]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1d1d1f] text-sm">What we&apos;ll access</h4>
                    <ul className="text-xs text-[#86868b] mt-2 space-y-1.5 leading-relaxed">
                      <li className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                        <span><strong>Google Drive</strong> — Create and manage files in a &quot;Freo Events&quot; folder only</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span><strong>Google Sheets</strong> — Read and write to sheets you link to events</span>
                      </li>
                    </ul>
                    <p className="text-[10px] text-[#86868b] mt-3 italic">
                      We only access files created by this app. Your personal files remain private.
                    </p>
                  </div>
                </div>
              </div>

              <form action={connectGoogleAccount}>
                <SubmitButton
                  className="w-full py-6 text-base font-semibold rounded-xl bg-[#1d1d1f] hover:bg-[#333336] text-white shadow-md transition-all flex items-center justify-center gap-3"
                  pendingText="Redirecting to Google..."
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Google Account
                </SubmitButton>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
