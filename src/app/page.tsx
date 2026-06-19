import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';

// Load our display and body fonts natively to avoid layout shifts or CDN lag
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
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 md:p-24 bg-[#000000] text-[#ffffff] antialiased`}>
      {/* MainContent */}
      <main className="w-full max-w-4xl flex flex-col items-center space-y-16 my-auto">
        
        {/* HeroSection */}
        <section className="flex flex-col items-center text-center space-y-8 w-full">
          {/* Top Logo Emblem */}
          <div 
            className={`${playfair.className} w-16 h-16 bg-[#000000] border border-[#ffffff] rounded-[2px] flex items-center justify-center text-2xl font-semibold`}
            data-purpose="logo-badge"
          >
            N
          </div>

          {/* Hero Copy */}
          <div className="space-y-4 max-w-2xl">
            <h1 className={`${playfair.className} text-4xl md:text-[64px] leading-tight font-normal text-[#ffffff]`}>
              NGO Attendance Tracking Portal
            </h1>
            <p className="text-[15px] text-[#5e616e] max-w-lg leading-relaxed mx-auto">
              Secure, verified, and automated attendance logging for physical offices and remote field visits.
            </p>
          </div>

          {/* CTA Button */}
          <Link 
            className="inline-flex items-center justify-center px-6 py-3 bg-[#ffffff] text-[#000000] font-medium text-sm rounded-[2px] hover:bg-gray-200 transition-colors duration-200" 
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
        <hr className="w-full border-t border-[#464853] max-w-3xl opacity-50" data-purpose="section-divider"/>

        {/* FeaturesSection */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl px-4" data-purpose="feature-highlights">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#201b17] border border-[#2e3038] text-[#ffffff] mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-medium text-[20px] text-[#ffffff]`}>6 Status Types</h3>
            <p className="text-[13px] text-[#5e616e] leading-relaxed">Check-in, Check-out, Leave records, and Field logs.</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#201b17] border border-[#2e3038] text-[#ffffff] mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-medium text-[20px] text-[#ffffff]`}>Geofencing</h3>
            <p className="text-[13px] text-[#5e616e] leading-relaxed">Automatic location radius checks against office coordinates.</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#201b17] border border-[#2e3038] text-[#ffffff] mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className={`${playfair.className} font-medium text-[20px] text-[#ffffff]`}>Real-time Dashboard</h3>
            <p className="text-[13px] text-[#5e616e] leading-relaxed">Instant warning system for admins upon boundary violation.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 pt-8 w-full border-t border-[#2e3038] text-center">
        <p className="text-[12px] text-[#5e616e]">
          © 2026 NGO Attendance Tracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}