"use client";

import Link from 'next/link';
import { Inter } from 'next/font/google';

// @ts-ignore
import PixelBlastComponent from '../components/PixelBlast';

// Cast as 'any' to completely silence all prop-checking warnings!
const PixelBlast = PixelBlastComponent as any;

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function Home() {
  return (
    <div className={`${inter.className} relative min-h-screen overflow-hidden flex flex-col items-center justify-between p-6 sm:p-12 md:p-24 bg-[#030014] text-[#f4f0ff] antialiased`}>
      
      {/* 1. BACKGROUND GLOW & STAR-FIELD PARTICLES */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9382ff]/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={5}
          color="#9382ff" // Replaced gold with the starlit Lavender Accent!
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
          {/* Top Logo Emblem: 5px Radius */}
          <div 
            className="w-10 h-10 bg-[#000000] border border-[#2e3038]/60 rounded-[5px] flex items-center justify-center text-lg font-medium text-[#f4f0ff]"
            data-purpose="logo-badge"
          >
            N
          </div>

          {/* Hero Copy */}
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-[56px] leading-tight font-medium text-[#f4f0ff] tracking-tight">
              NGO Attendance <br />
              {/* Highlight with the beautiful Cosmic Gradient! */}
              <span 
                style={{
                  backgroundImage: 'linear-gradient(90.01deg, #e59cff 0.01%, #ba9cff 50.01%, #9cb2ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                className="inline-block"
              >
                Tracking Portal
              </span>
            </h1>
            <p className="text-[15px] text-[#a8a6b7] max-w-lg leading-relaxed mx-auto">
              Secure, verified, and automated attendance logging for physical offices and remote field visits.
            </p>
          </div>

          {/* CTA Button: Iris background, 5px Radius */}
          <Link 
            className="inline-flex items-center justify-center px-6 py-3 bg-[#5046e4] text-[#ffffff] font-medium text-sm rounded-[5px] hover:bg-[#10093a] border border-[#9382ff]/30 transition-all duration-300 shadow" 
            data-purpose="cta-button" 
            href="/role-selection"
          >
            <span>Get Started / Access Portal</span>
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </Link>
        </section>

        {/* 3. AURORA DIVIDER: Violet glow fading out at both ends */}
        <div 
          className="w-full max-w-3xl h-[1px] opacity-40" 
          style={{
            background: 'linear-gradient(90deg, rgba(125,98,255,0) 0%, rgba(125,98,255,1) 50%, rgba(125,98,255,0) 100%)'
          }} 
        />

        {/* FeaturesSection */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl px-4" data-purpose="feature-highlights">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#060317] border border-[#2e3038]/60 text-[#f4f0ff] mb-2 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className="font-medium text-[18px] text-[#f4f0ff]">6 Status Types</h3>
            <p className="text-[13px] text-[#a8a6b7] leading-relaxed">Check-in, Check-out, Leave records, and Field logs.</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#060317] border border-[#2e3038]/60 text-[#f4f0ff] mb-2 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className="font-medium text-[18px] text-[#f4f0ff]">Geofencing</h3>
            <p className="text-[13px] text-[#a8a6b7] leading-relaxed">Automatic location radius checks against office coordinates.</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#060317] border border-[#2e3038]/60 text-[#f4f0ff] mb-2 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className="font-medium text-[18px] text-[#f4f0ff]">Real-time Dashboard</h3>
            <p className="text-[13px] text-[#a8a6b7] leading-relaxed">Instant warning system for admins upon boundary violation.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 pt-8 w-full border-t border-[#2e3038]/40 text-center">
        <p className="text-[12px] text-[#918ea0]">
          © 2026 NGO Attendance Tracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}