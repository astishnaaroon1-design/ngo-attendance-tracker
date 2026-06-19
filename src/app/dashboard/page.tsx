'use client';

import { logAttendanceAction } from '../actions/attendance';
import { useState, useEffect } from 'react';
import { useUser, SignOutButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../lib/supabase';
import { calculateDistance, checkIfLate } from '../lib/geofence';
import { MapPin, CheckCircle, ShieldAlert, LogOut, Loader2, Calendar, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EmployeeDashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // Clerk helper to fetch our secure Supabase token
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
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);

      const { data, error } = await client
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
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);

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
        // Safe check: Ensure astishna09@gmail.com is always elevated to admin automatically
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
        reject(new Error('Your web browser does not support location tracking. Please try another modern browser.'));
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
      // 1. Get exact GPS Coordinates
      const position = await getBrowserLocation();
      const { latitude, longitude, accuracy } = position.coords;
      setLocationStatus('GPS signal locked. Sending to secure server...');

      // 2. Invoke our Secure Server Action
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

  // While loading or redirecting, show a friendly status screen
  if (!isLoaded || !user || !profileRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500">Routing access credentials safely...</p>
        </div>
      </div>
    );
  }

  // Awaiting Admin Approval screen
  if (profileRole === 'pending_admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <Lock className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-slate-800">Awaiting Admin Approval</h1>
        <p className="text-slate-600 mt-2 max-w-sm text-sm">
          Your request to join as an Administrator has been recorded. For security, the primary administrator (**`astishna09@gmail.com`**) must manually approve your request before you can access the admin dashboard.
        </p>
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              localStorage.setItem('selected_role', 'employee');
              window.location.reload();
            }}
            className="bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-lg text-xs"
          >
            Access standard Employee Portal
          </button>
          <SignOutButton>
            <button className="bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-lg text-xs">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Navbar Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="font-bold text-gray-800 text-lg">NGO Portal</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 font-medium">Welcome, {user?.fullName}</span>
          <SignOutButton>
            <button className="flex items-center space-x-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md font-semibold transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Attendance Action Box */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-gray-800">
            <MapPin className="text-emerald-600 w-5 h-5" />
            <span>Mark Daily Attendance</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Status Category</label>
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
                    className={`p-3 text-sm font-semibold rounded-lg border text-left transition-all ${status === opt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Explain Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Examples: Sick description, specific project site field name, leave justification..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {locationStatus && (
              <p className="text-xs text-amber-600 animate-pulse flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {locationStatus}
              </p>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg flex items-start space-x-2 text-sm leading-relaxed ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-100'
                  }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Location and Verify
            </button>
          </form>
        </div>

        {/* History / Logs Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>My Attendance History</span>
          </h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No attendance submissions logged yet.</p>
            ) : (
              history.map((rec) => (
                <div key={rec.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs space-y-1 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">{rec.status}</span>
                    <span className="text-gray-500 font-medium">
                      {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-gray-400 font-medium">{new Date(rec.date).toLocaleDateString()}</div>

                  {rec.notes && <p className="text-gray-600 italic mt-1 font-sans">"{rec.notes}"</p>}

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