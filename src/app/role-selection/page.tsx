'use client';

import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Users, Settings, ArrowRight } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function RoleSelection() {
  const router = useRouter();

  const handleSelectRole = (role: 'employee' | 'admin') => {
    localStorage.setItem('selected_role', role);
    router.push('/dashboard');
  };

  return (
    <div className={`${inter.className} bg-[#030014] min-h-screen flex items-center justify-center p-4 antialiased selection:bg-[#9382ff]/30 selection:text-white relative overflow-hidden`}>
      
      {/* 1. DUST & STAR-FIELD GLOW: Elegant background depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#9382ff]/10 blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* 2. THE CARD: Midnight Surface container with inset white glow */}
      <div className="relative z-10 w-full max-w-[420px]">
        <main 
          className="w-full bg-[#060317]/95 border border-[#2e3038]/40 rounded-[24px] p-8 md:p-10 flex flex-col gap-8 shadow-2xl shadow-black"
          style={{
            boxShadow: 'inset 0 0 24px rgba(255, 255, 255, 0.04), 0 20px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header Section */}
          <header className="flex flex-col items-center text-center gap-6">
            {/* Logo Mark: 5px Radius */}
            <div className="w-10 h-10 flex items-center justify-center bg-[#000000] border border-[#2e3038]/60 rounded-[5px] text-[#f4f0ff] font-medium text-lg">
              N
            </div>
            
            {/* Titles: Whispering Inter Weight 500 */}
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-medium text-[#f4f0ff] tracking-tight">Choose Portal Access</h1>
              <p className="text-xs text-[#9194a1] max-w-xs mx-auto leading-relaxed">
                Please select your primary operational role inside the NGO.
              </p>
            </div>
          </header>

          {/* Selection Blocks */}
          <div className="flex flex-col gap-3">
            {/* Employee Portal */}
            <button 
              onClick={() => handleSelectRole('employee')}
              className="w-full group flex items-center gap-4 p-4 bg-[#08080a]/80 border border-[#2e3038]/60 rounded-[5px] hover:border-[#9382ff]/40 hover:bg-[#10093a]/40 transition-all duration-300 text-left"
              style={{
                boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.02)'
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1d22]/50 group-hover:bg-[#9382ff]/10 transition-colors duration-300">
                <Users className="text-[#9382ff] w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-0.5">
                <h2 className="text-sm font-medium text-[#f4f0ff] group-hover:text-[#9382ff] transition-colors duration-300">Employee Portal</h2>
                <p className="text-[11px] text-[#9194a1]">Mark daily check-in, leaves, and field visits.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#5e616e] group-hover:translate-x-1 group-hover:text-[#9382ff] transition-all duration-300 mr-2" />
            </button>

            {/* Administrator Portal */}
            <button 
              onClick={() => handleSelectRole('admin')}
              className="w-full group flex items-center gap-4 p-4 bg-[#08080a]/80 border border-[#2e3038]/60 rounded-[5px] hover:border-[#9382ff]/40 hover:bg-[#10093a]/40 transition-all duration-300 text-left"
              style={{
                boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.02)'
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1d22]/50 group-hover:bg-[#9382ff]/10 transition-colors duration-300">
                <Settings className="text-[#9382ff] w-4 h-4" />
              </div>
              <div className="flex-grow flex flex-col gap-0.5">
                <h2 className="text-sm font-medium text-[#f4f0ff] group-hover:text-[#9382ff] transition-colors duration-300">Administration Portal</h2>
                <p className="text-[11px] text-[#9194a1]">Configure boundaries, approve users, and export logs.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#5e616e] group-hover:translate-x-1 group-hover:text-[#9382ff] transition-all duration-300 mr-2" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}