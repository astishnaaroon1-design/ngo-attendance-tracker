'use client';

import { useRouter } from 'next/navigation';
import { Playfair_Display, Inter } from 'next/font/google';
import { Users, Settings, ArrowRight } from 'lucide-react';

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
    router.push('/dashboard');
  };

  return (
    <div className={`${inter.className} bg-[#f8fafc] min-h-screen flex items-center justify-center p-4 antialiased selection:bg-[#059669]/20 selection:text-[#059669] relative overflow-hidden`}>
      
      {/* Background soft green glow flares */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* THE CARD: Clean White container with subtle shadow */}
      <div className="relative z-10 w-full max-w-[420px]">
        <main className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-[24px] p-8 md:p-10 flex flex-col gap-8 shadow-xl shadow-slate-100">
          
          {/* Header Section */}
          <header className="flex flex-col items-center text-center gap-6">
            {/* Logo Mark: Custom Emerald Box */}
            <div className={`${playfair.className} w-10 h-10 flex items-center justify-center bg-[#ffffff] border border-[#059669] rounded-[8px] text-[#059669] font-bold text-xl shadow-sm`}>
              N
            </div>
            
            {/* Titles */}
            <div className="flex flex-col gap-2">
              <h1 className={`${playfair.className} text-[24px] font-normal text-[#0f172a] tracking-tight`}>
                Choose Portal Access
              </h1>
              <p className="text-[12px] leading-relaxed text-[#475569] max-w-xs mx-auto">
                Please select your primary operational role inside the NGO.
              </p>
            </div>
          </header>

          {/* Selection Blocks */}
          <div className="flex flex-col gap-3">
            {/* Employee Portal */}
            <button 
              onClick={() => handleSelectRole('employee')}
              className="w-full group flex items-center gap-4 p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] hover:border-[#059669]/50 hover:bg-[#f0fdf4] transition-all duration-300 text-left cursor-pointer"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#ffffff] border border-[#cbd5e1] group-hover:border-[#059669]/30 group-hover:bg-[#f0fdf4] transition-colors duration-300 text-[#059669]">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-0.5">
                <h2 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#059669] transition-colors duration-300">
                  Employee Portal
                </h2>
                <p className="text-[11px] text-[#475569]">
                  Mark daily check-in, leaves, and field visits.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#059669] group-hover:translate-x-1 transition-all duration-300 ml-auto" />
            </button>

            {/* Administrator Portal */}
            <button 
              onClick={() => handleSelectRole('admin')}
              className="w-full group flex items-center gap-4 p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] hover:border-[#059669]/50 hover:bg-[#f0fdf4] transition-all duration-300 text-left cursor-pointer"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#ffffff] border border-[#cbd5e1] group-hover:border-[#059669]/30 group-hover:bg-[#f0fdf4] transition-colors duration-300 text-[#059669]">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-0.5">
                <h2 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#059669] transition-colors duration-300">
                  Administration Portal
                </h2>
                <p className="text-[11px] text-[#475569]">
                  Configure boundaries, approve users, and export logs.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#059669] group-hover:translate-x-1 transition-all duration-300 ml-auto" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}