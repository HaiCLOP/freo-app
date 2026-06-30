import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f5f1e4] flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1B1C20] mb-8 hover:text-[#8ed462] transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        
        <div className="neo-card bg-white p-12 text-center">
          <div className="inline-block px-4 py-1.5 bg-[#8ed462] text-[#2c2e2a] font-bold text-sm uppercase tracking-widest border-2 border-[#2c2e2a] mb-6 shadow-[2px_2px_0px_0px_#2c2e2a]">
            Coming Soon
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1B1C20] mb-6 tracking-tight uppercase">
            LEGAL PRIVACY
          </h1>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            We are working hard to bring you the best experience. This page is currently under development. Check back later for updates!
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
