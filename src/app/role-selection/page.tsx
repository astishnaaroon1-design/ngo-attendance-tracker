'use client';

import { useRouter } from 'next/navigation';
import { Users, Settings, ArrowRight } from 'lucide-react';

export default function RoleSelection() {
  const router = useRouter();

  const handleSelectRole = (role: 'employee' | 'admin') => {
    localStorage.setItem('selected_role', role);
    router.push('/dashboard'); // This triggers the Clerk sign-in/up guard automatically
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
            N
          </div>
          <h2 className="text-2xl font-black text-slate-800">Choose Portal Access</h2>
          <p className="text-xs text-slate-500 mt-1">Please select your primary operational role inside the NGO.</p>
        </div>

        <div className="space-y-4">
          {/* Employee Option */}
          <button
            onClick={() => handleSelectRole('employee')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Employee Portal</h4>
                <p className="text-[10px] text-slate-400">Mark daily check-in, leaves, and field visits.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Admin Option */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Administration Portal</h4>
                <p className="text-[10px] text-slate-400">Configure boundaries, approve users, and export logs.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}