"use client";

import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';

// @ts-ignore
import PixelBlastComponent from '../components/PixelBlast';

// Cast as 'any' to completely silence all prop-checking warnings!
const PixelBlast = PixelBlastComponent as any;

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function Home() {
  return (
    <div className={`${inter.className} relative min-h-screen overflow-hidden flex flex-col items-center justify-between p-6 sm:p-12 md:p-24 bg-[#f8fafc] text-[#0f172a] antialiased`}>
      
      {/* 1. BACKGROUND DECORATIVE FLOATING PARTICLES */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 z-0 opacity-40">
        <PixelBlast
          variant="circle"
          pixelSize={5}
          color="#059669" // Emerald green particles reacting to your mouse movement!
          patternScale={0.75}
          patternDensity={0.45}
          enableRipples
          rippleSpeed={0.3}
          rippleThickness={0.1}
          rippleIntensityScale={1}
          speed={0.2}
          transparent
          edgeFade={0.19}
        />
      </div>

      {/* 2. THE CONTENT LAYER */}
      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center space-y-16 my-auto">
        
        {/* HeroSection */}
        <section className="flex flex-col items-center text-center space-y-8 w-full">
          {/* Top Logo Emblem */}
          <div 
            className={`${playfair.className} w-12 h-12 bg-[#ffffff] border border-[#cbd5e1] rounded-[8px] flex items-center justify-center text-2xl font-bold text-[#059669] shadow-sm`}
            data-purpose="logo-badge"
          >
            N
          </div>

          {/* Hero Copy */}
          <div className="space-y-4 max-w-2xl">
            <h1 className={`${playfair.className} text-4xl md:text-[64px] leading-tight font-normal text-[#0f172a]`}>
              NGO Attendance <br />
              <span className="text-[#059669] italic font-semibold">Tracking Portal</span>
            </h1>
            <p className="text-[15px] text-[#475569] max-w-lg leading-relaxed mx-auto">
              Secure, verified, and automated attendance logging for physical offices and remote field visits.
            </p>
          </div>

          {/* CTA Button: Emerald green background, rounded-lg */}
          <Link 
            className="inline-flex items-center justify-center px-6 py-3 bg-[#059669] text-[#ffffff] font-semibold text-sm rounded-[8px] hover:bg-[#047857] transition-all duration-300 shadow-md" 
            data-purpose="cta-button" 
            href="/role-selection"
          >
            <span>Get Started / Access Portal</span>
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </Link>
        </section>

        {/* Divider */}
        <hr className="w-full border-t border-[#cbd5e1] max-w-3xl opacity-60" data-purpose="section-divider"/>

        {/* FeaturesSection */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl px-4" data-purpose="feature-highlights">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center space-y-3 bg-[#ffffff] border border-[#e2e8f0] p-6 rounded-[16px] shadow-sm">
            <div className="p-3 rounded-full bg-[#f0fdf4] border border-[#bcf0da] text-[#059669] mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-semibold text-[18px] text-[#0f172a]`}>6 Status Types</h3>
            <p className="text-[13px] text-[#475569] leading-relaxed">Check-in, Check-out, Leave records, and Field logs.</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center space-y-3 bg-[#ffffff] border border-[#e2e8f0] p-6 rounded-[16px] shadow-sm">
            <div className="p-3 rounded-full bg-[#f0fdf4] border border-[#bcf0da] text-[#059669] mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-semibold text-[18px] text-[#0f172a]`}>Geofencing</h3>
            <p className="text-[13px] text-[#475569] leading-relaxed">Automatic location radius checks against office coordinates.</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center space-y-3 bg-[#ffffff] border border-[#e2e8f0] p-6 rounded-[16px] shadow-sm">
            <div className="p-3 rounded-full bg-[#f0fdf4] border border-[#bcf0da] text-[#059669] mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-semibold text-[18px] text-[#0f172a]`}>Real-time Dashboard</h3>
            <p className="text-[13px] text-[#475569] leading-relaxed">Instant warning system for admins upon boundary violation.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 pt-8 w-full border-t border-[#cbd5e1] text-center">
        <p className="text-[12px] text-[#475569]">
          © 2026 NGO Attendance Tracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}