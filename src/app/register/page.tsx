import { register } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Register | Freo',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#DDFE55] p-12 text-[#1B1C20] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Image src="/freologo.png" alt="Freo Logo" width={48} height={48} className="rounded-xl object-contain bg-[#1B1C20] p-0.5 shadow-md" />
            <span className="text-4xl font-bold tracking-tight text-[#1B1C20] font-[family-name:var(--font-fredoka)]">Freo</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 mt-20">
            Start managing<br />events today.
          </h1>
          <p className="text-[#1B1C20]/80 text-lg max-w-md leading-relaxed font-medium">
            Join the premium platform for managing your paid events. Create an account to start collecting registrations and verifying payments.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex gap-6 text-sm text-[#1B1C20]/80 font-bold">
            <Link href="/privacy" className="hover:text-[#1B1C20] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1B1C20] transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm text-[#1B1C20]/60 font-bold">© 2026 HaiCLOP Labs. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 bg-[#1B1C20]">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <Image src="/freologo.png" alt="Freo Logo" width={32} height={32} className="rounded-lg object-contain bg-[#DDFE55] p-0.5" />
            <span className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-fredoka)]">Freo</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create an account</h2>
            <p className="text-gray-400">Sign up to get started as a creator.</p>
          </div>

          <div className="bg-[#2A2B31] border border-[#3A3B41] rounded-2xl p-8 subtle-shadow">
            <form action={register} className="space-y-5">
              {resolvedParams.error && (
                <div className="bg-red-500/10 text-red-400 text-sm p-4 rounded-xl border border-red-500/20 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                  {resolvedParams.error}
                </div>
              )}
              
              {resolvedParams.message && (
                <div className="bg-green-500/10 text-green-400 text-sm p-4 rounded-xl border border-green-500/20 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></div>
                  {resolvedParams.message}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium">Email address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-[#DDFE55] transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="pl-10 py-6 bg-[#1B1C20] border-[#3A3B41] text-white focus-visible:ring-[#DDFE55]/20 focus-visible:border-[#DDFE55] transition-all rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-[#DDFE55] transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-10 py-6 bg-[#1B1C20] border-[#3A3B41] text-white focus-visible:ring-[#DDFE55]/20 focus-visible:border-[#DDFE55] transition-all rounded-xl"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
              </div>

              <SubmitButton
                className="w-full py-6 text-base font-bold rounded-xl bg-[#DDFE55] hover:bg-[#c9eb44] transition-all duration-300 text-[#1B1C20] shadow-md hover:shadow-[#DDFE55]/25 mt-4 group"
                pendingText="Signing Up..."
              >
                Sign Up
                <UserPlus className="w-4 h-4 ml-2 opacity-70 group-hover:scale-110 transition-transform" />
              </SubmitButton>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-[#DDFE55] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 lg:hidden flex flex-col items-center gap-4">
            <div className="flex gap-4 text-sm text-gray-400 font-medium">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span>&middot;</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-xs text-gray-500 font-medium">© 2026 HaiCLOP Labs. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
