'use client';

import { useRouter } from 'next/navigation';
import { Playfair_Display, Inter } from 'next/font/google';
import { Users, Settings, ArrowRight } from 'lucide-react';

// Load our display and body fonts natively to avoid layout shifts or loading lag
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function RoleSelection() {
  const router = useRouter();

  const handleSelectRole = (role: 'employee' | 'admin') => {
    localStorage.setItem('selected_role', role);
    router.push('/dashboard'); // Direct transition to the secure login/dashboard gateway
  };

  return (
    <div className={`${inter.className} bg-[#000000] min-h-screen flex items-center justify-center p-4 antialiased selection:bg-[#cc9166]/30 selection:text-white relative overflow-hidden`}>
      
      {/* 1. SECURE GLOW FLARES: Creates the premium private-banking gradient depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#cc9166]/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* 2. THE CARD: Floating glass container */}
      <div className="relative z-10 w-full max-w-[420px]">
        <main className="w-full bg-[#1c1d22]/90 backdrop-blur-md border border-[#2e3038]/50 rounded-[32px] p-8 md:p-10 flex flex-col gap-8 shadow-2xl">
          
          {/* Header Section */}
          <header className="flex flex-col items-center text-center gap-6">
            {/* Logo Mark */}
            <div className={`${playfair.className} w-10 h-10 flex items-center justify-center bg-[#000000] border border-[#2e3038]/50 rounded text-[#e2e3e9] text-xl shadow-inner`}>
              N
            </div>
            {/* Titles */}
            <div className="flex flex-col gap-2">
              <h1 className={`${playfair.className} text-[24px] font-normal text-[#e2e3e9] tracking-tight`}>
                Choose Portal Access
              </h1>
              <p className="text-[12px] leading-relaxed text-[#acafb9] max-w-xs mx-auto">
                Please select your primary operational role inside the NGO.
              </p>
            </div>
          </header>

          {/* Selection Blocks */}
          <div className="flex flex-col gap-3">
            {/* Employee Portal */}
            <button 
              onClick={() => handleSelectRole('employee')}
              className="w-full group flex items-center gap-4 p-4 bg-[#08080a]/80 border border-[#2e3038]/60 rounded-[8px] hover:border-[#cc9166]/50 hover:bg-[#08080a] transition-all duration-300 text-left"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1d22] group-hover:bg-[#cc9166]/10 transition-colors duration-300 text-[#cc9166]">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-[#e2e3e9] group-hover:text-[#cc9166] transition-colors duration-300">
                  Employee Portal
                </h2>
                <p className="text-[11px] text-[#acafb9]">
                  Mark daily check-in, leaves, and field visits.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#acafb9] group-hover:text-[#cc9166] transition-colors duration-300 ml-auto" />
            </button>

            {/* Administration Portal */}
            <button 
              onClick={() => handleSelectRole('admin')}
              className="w-full group flex items-center gap-4 p-4 bg-[#08080a]/80 border border-[#2e3038]/60 rounded-[8px] hover:border-[#cc9166]/50 hover:bg-[#08080a] transition-all duration-300 text-left"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1d22] group-hover:bg-[#cc9166]/10 transition-colors duration-300 text-[#cc9166]">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-[#e2e3e9] group-hover:text-[#cc9166] transition-colors duration-300">
                  Administration Portal
                </h2>
                <p className="text-[11px] text-[#acafb9]">
                  Configure boundaries, approve users, and export logs.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#acafb9] group-hover:text-[#cc9166] transition-colors duration-300 ml-auto" />
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}