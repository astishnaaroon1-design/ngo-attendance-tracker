'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { calculateDistance, checkIfLate } from '../lib/geofence';
import { MapPin, CheckCircle, ShieldAlert, LogOut, Loader2, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EmployeeDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
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

  // Fetch log history on page load
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user]);

  const fetchUserHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
  };

  // Helper to ensure a profile exists in Supabase before logging attendance
  const ensureProfileExists = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error verifying profile:', error);
    }

    if (!data) {
      // Create profile row on the fly
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        role: 'employee',
        department: 'General',
        is_active: true,
      });
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
      setLocationStatus('GPS signal locked successfully.');

      // 2. Ensure Profile exists in Supabase
      await ensureProfileExists();

      // 3. Retrieve current Geofencing configurations
      const { data: config, error: configError } = await supabase
        .from('geofence_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (configError || !config) {
        throw new Error('Could not download office boundary configurations from the server.');
      }

      // 4. Run distance checks
      const distanceInMeters = calculateDistance(latitude, longitude, config.latitude, config.longitude);
      const isOutOfGeofence = distanceInMeters > config.radius_meters;

      const now = new Date();
      let isLate = false;

      // Check for lateness only on office "Check-In" status
      if (status === 'Check-In') {
        isLate = checkIfLate(now, config.official_start_time);
      }

      // Suppress out-of-geofence trigger for Field Visits
      const finalGeofenceAlert = (status === 'Field Visit') ? false : isOutOfGeofence;

      // 5. Structure our record payload
      const recordPayload: any = {
        profile_id: user?.id,
        status: status,
        notes: notes,
        gps_accuracy: accuracy,
        is_late: isLate,
        is_out_of_geofence: finalGeofenceAlert,
      };

      if (status === 'Check-In' || status === 'Field Visit') {
        recordPayload.check_in_time = now.toISOString();
        recordPayload.check_in_lat = latitude;
        recordPayload.check_in_lng = longitude;
      } else if (status === 'Check-Out') {
        recordPayload.check_out_time = now.toISOString();
        recordPayload.check_out_lat = latitude;
        recordPayload.check_out_lng = longitude;
      }

      // 6. Write the log to our database
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert([recordPayload]);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(`You have already logged your "${status}" status for today.`);
        }
        throw new Error(insertError.message || 'Failed to submit database entry.');
      }

      // 7. Write triggered alerts to our Notifications table
      if (isLate) {
        await supabase.from('notifications').insert({
          profile_id: user?.id,
          type: 'late_checkin',
          title: 'Late Arrival Logged',
          message: `${user?.fullName || 'An employee'} checked in late at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        });
      }

      if (finalGeofenceAlert) {
        await supabase.from('notifications').insert({
          profile_id: user?.id,
          type: 'out_of_geofence',
          title: 'Out of Geofence Check-in',
          message: `${user?.fullName || 'An employee'} logged attendance ${Math.round(distanceInMeters)} meters away from the office.`
        });
      }

      // Celebrate clean logins!
      if (!finalGeofenceAlert && !isLate) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      }

      setMessage({
        type: 'success',
        text: `Successfully logged your status: "${status}"! ${
          finalGeofenceAlert ? 'Caution: System noted that you are outside of the office boundary.' : ''
        }`,
      });
      setNotes('');
      setStatus('');
      fetchUserHistory();

    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'GPS lookup failed. Please make sure location settings are allowed in your browser settings.',
      });
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  // While loading or redirecting, show a friendly status screen
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500">Redirecting to login portal...</p>
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
                    className={`p-3 text-sm font-semibold rounded-lg border text-left transition-all ${
                      status === opt
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
                className={`p-4 rounded-lg flex items-start space-x-2 text-sm leading-relaxed ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-100'
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