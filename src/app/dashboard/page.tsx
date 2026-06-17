import Link from 'next/link';
import { ShieldCheck, UserCheck, CalendarDays, ExternalLink } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-6">
          N
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight max-w-xl">
          NGO Attendance Tracking Portal
        </h1>
        
        <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-md leading-relaxed">
          Secure, verified, and automated attendance logging for physical offices and remote field visits.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm"
          >
            <UserCheck className="w-5 h-5" />
            <span>Employee Portal</span>
          </Link>
          
          <Link
            href="/dashboard/admin"
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Small Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full border-t border-slate-200 pt-10">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">6 Status Types</h3>
            <p className="text-xs text-slate-500 mt-1">Check-in, Check-out, Leave records, and Field logs.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Geofencing</h3>
            <p className="text-xs text-slate-500 mt-1">Automatic location radius checks against target office coords.</p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <ExternalLink className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Real-time Dashboard</h3>
            <p className="text-xs text-slate-500 mt-1">Instant warning system for admins upon violation.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 font-medium bg-white">
        © 2026 NGO Attendance Tracker. All rights reserved.
      </footer>
    </div>
  );
}