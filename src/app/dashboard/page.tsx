'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../lib/supabase'; // Correct relative import (1 step up)
import { logAttendanceAction } from '../actions/attendance'; // Correct relative import (1 step up)
import { MapPin, CheckCircle, ShieldAlert, LogOut, Loader2, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EmployeeDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // 1. Safe Redirect Guard if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // 2. Load and verify user profile
  useEffect(() => {
    if (user) {
      verifyRoleAndFetchData();
    }
  }, [user]);

  const verifyRoleAndFetchData = async () => {
    const role = await ensureProfileExists();
    setProfileRole(role);

    // If fully approved Admin, redirect automatically
    if (role === 'admin') {
      router.push('/dashboard/admin');
    } else if (role === 'employee') {
      fetchUserHistory();
    }
  };

  const fetchUserHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await getSupabaseClient()
        .from('attendance_records')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const ensureProfileExists = async () => {
    if (!user) return 'employee';
    const email = user.primaryEmailAddress?.emailAddress || '';
    
    // Check local storage for the chosen role
    const selectedRole = typeof window !== 'undefined' ? localStorage.getItem('selected_role') : 'employee';
    
    let designatedRole = 'employee';
    if (selectedRole === 'admin') {
      designatedRole = email.toLowerCase() === 'astishna09@gmail.com' ? 'admin' : 'pending_admin';
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        // Create profile row on the fly
        await client.from('profiles').insert({
          id: user.id,
          email: email,
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          role: designatedRole,
          department: 'General',
          is_active: true,
        });
        return designatedRole;
      } else {
        if (email.toLowerCase() === 'astishna09@gmail.com' && data.role !== 'admin') {
          await client.from('profiles').update({ role: 'admin' }).eq('id', user.id);
          return 'admin';
        }
        return data.role;
      }
    } catch (err) {
      console.error('Profile synchronization error:', err);
      return 'employee';
    }
  };

  const getBrowserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Your web browser does not support location tracking.'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setMessage({ type: 'error', text: 'Please select your attendance status first.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setLocationStatus('Accessing browser satellite/GPS sensors...');

    try {
      const position = await getBrowserLocation();
      const { latitude, longitude, accuracy } = position.coords;
      setLocationStatus('GPS signal locked. Sending to secure server...');

      // Invoke our Secure Server Action
      const result = await logAttendanceAction(
        status,
        latitude,
        longitude,
        accuracy,
        notes
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.isOutOfGeofence || result.isLate) {
        setMessage({
          type: 'success',
          text: `Logged status: "${status}"! Caution: System noted warnings on your entry (Check-in late or out-of-boundary).`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Successfully logged status: "${status}"!`,
        });
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      }

      setNotes('');
      setStatus('');
      fetchUserHistory();

    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'GPS lookup failed.',
      });
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  if (!isLoaded || !user || !profileRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#059669] mx-auto" />
          <p className="text-sm text-slate-500 font-semibold">Routing access credentials safely...</p>
        </div>
      </div>
    );
  }

  if (profileRole === 'pending_admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-amber-600 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-[#0f172a]">Awaiting Admin Approval</h1>
        <p className="text-slate-600 mt-2 max-w-sm text-sm leading-relaxed">
          Your request to join as an Administrator has been recorded. For security, the primary administrator (**`astishna09@gmail.com`**) must manually approve your request before you can access the admin dashboard.
        </p>
        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => {
              localStorage.setItem('selected_role', 'employee');
              window.location.reload();
            }}
            className="bg-[#059669] text-white font-semibold py-2.5 px-5 rounded-lg text-xs hover:bg-[#047857] cursor-pointer"
          >
            Access standard Employee Portal
          </button>
          <SignOutButton>
            <button className="bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-lg text-xs cursor-pointer">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-12">
      {/* Navbar Header */}
      <header className="bg-[#ffffff] border-b border-[#cbd5e1]/60 py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <span className="font-bold text-[#0f172a] text-lg">NGO Portal</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-[#475569] font-medium">Welcome, {user?.fullName}</span>
          <SignOutButton>
            <button className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-2 rounded-md font-semibold transition-colors cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Attendance Action Box */}
        <div className="md:col-span-2 bg-[#ffffff] rounded-[16px] border border-[#cbd5e1]/60 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-[#059669]">
            <MapPin className="w-5 h-5" />
            <span>Mark Daily Attendance</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-2">Select Your Status Category</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Check-In',
                  'Check-Out',
                  'Annual Leave',
                  'Casual Leave',
                  'Sick Leave',
                  'Field Visit',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatus(opt)}
                    className={`p-3 text-sm font-semibold rounded-lg border text-left transition-all cursor-pointer ${
                      status === opt
                        ? 'border-[#059669] bg-[#f0fdf4] text-[#059669] ring-2 ring-[#059669]/20'
                        : 'border-[#cbd5e1] bg-[#ffffff] text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Explain Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Examples: Sick description, specific project site field name, leave justification..."
                rows={3}
                className="w-full rounded-lg border border-[#cbd5e1] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#059669] bg-[#ffffff] text-[#0f172a]"
              />
            </div>

            {locationStatus && (
              <p className="text-xs text-amber-600 animate-pulse flex items-center gap-1.5 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {locationStatus}
              </p>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg flex items-start space-x-2 text-sm leading-relaxed ${
                  message.type === 'success' ? 'bg-[#f0fdf4] text-emerald-950 border border-emerald-100' : 'bg-rose-50 border border-rose-100 text-rose-950'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#059669] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#047857] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Location and Verify
            </button>
          </form>
        </div>

        {/* History / Logs Sidebar */}
        <div className="bg-[#ffffff] rounded-[16px] border border-[#cbd5e1]/60 p-6 shadow-sm">
          <h3 className="font-bold text-[#059669] mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>My Attendance History</span>
          </h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No attendance submissions logged yet today.</p>
            ) : (
              history.map((rec) => (
                <div key={rec.id} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs space-y-1 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0f172a]">{rec.status}</span>
                    <span className="text-slate-500 font-semibold">
                      {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-400 font-semibold">{new Date(rec.date).toLocaleDateString()}</div>
                  
                  {rec.notes && <p className="text-slate-600 italic mt-1 font-sans">"{rec.notes}"</p>}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.is_out_of_geofence && (
                      <span className="bg-rose-50 text-rose-800 border border-rose-100 rounded px-1.5 py-0.5 font-bold text-[9px]">
                        Out of Geofence
                      </span>
                    )}
                    {rec.is_late && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-100 rounded px-1.5 py-0.5 font-bold text-[9px]">
                        Late Check-in
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}