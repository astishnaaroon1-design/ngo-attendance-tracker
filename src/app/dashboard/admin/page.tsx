'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Users, Calendar, Settings, FileSpreadsheet, Bell, 
  Loader2, LogOut, Search, MapPin, Check, Edit, Plus, AlertTriangle, Trash2 
} from 'lucide-react';

export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'settings' | 'reports'>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Database States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilterDate, setAttendanceFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Form States (Settings edit)
  const [officeLat, setOfficeLat] = useState('');
  const [officeLng, setOfficeLng] = useState('');
  const [radius, setRadius] = useState('');
  const [startTime, setStartTime] = useState('');

  // Form States (Add/Edit Employee)
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpFirst, setNewEmpFirst] = useState('');
  const [newEmpLast, setNewEmpLast] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'employee' | 'admin'>('employee');

  // Form States (Manual Attendance Entry)
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualProfileId, setManualProfileId] = useState('');
  const [manualStatus, setManualStatus] = useState('Check-In');
  const [manualNotes, setManualNotes] = useState('');

  // 1. Safe Redirect Guard if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (user) {
      verifyRoleAndFetchData();
    }
  }, [user]);

  const verifyRoleAndFetchData = async () => {
    try {
      setLoading(true);
      
      // Check if user is actually an Admin in Supabase
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();

      if (profError || !profile || profile.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch all system configurations
      await Promise.all([
        fetchProfiles(),
        fetchAttendance(),
        fetchSettings(),
        fetchNotifications()
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('last_name', { ascending: true });
    if (data) setProfiles(data);
  };

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from('attendance_records')
      .select('*, profiles(first_name, last_name, department)')
      .order('created_at', { ascending: false });
    if (data) setAttendance(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('geofence_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
      setOfficeLat(data.latitude.toString());
      setOfficeLng(data.longitude.toString());
      setRadius(data.radius_meters.toString());
      setStartTime(data.official_start_time);
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setNotifications(data);
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('geofence_settings')
      .update({
        latitude: parseFloat(officeLat),
        longitude: parseFloat(officeLng),
        radius_meters: parseFloat(radius),
        official_start_time: startTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (!error) {
      alert('Geofence and office configurations updated successfully.');
      fetchSettings();
    } else {
      alert('Failed to update configurations: ' + error.message);
    }
  };

  // Add Employee Manually (creating a profile entry in Supabase)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newEmpEmail) {
      alert('Please provide a unique ID (e.g., clerk user ID) and Email.');
      return;
    }

    const { error } = await supabase.from('profiles').insert({
      id: newEmpId,
      email: newEmpEmail,
      first_name: newEmpFirst,
      last_name: newEmpLast,
      role: newEmpRole,
      department: newEmpDept,
      is_active: true
    });

    if (!error) {
      alert('Profile registered successfully.');
      setShowAddEmp(false);
      setNewEmpId('');
      setNewEmpEmail('');
      setNewEmpFirst('');
      setNewEmpLast('');
      setNewEmpDept('');
      fetchProfiles();
    } else {
      alert('Error registering profile: ' + error.message);
    }
  };

  // Manual Attendance Log
  const handleManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProfileId) {
      alert('Please select an employee.');
      return;
    }

    const now = new Date();
    const { error } = await supabase.from('attendance_records').insert({
      profile_id: manualProfileId,
      status: manualStatus,
      notes: manualNotes + ' (Logged Manually by Administrator)',
      date: attendanceFilterDate,
      check_in_time: manualStatus === 'Check-In' ? now.toISOString() : null,
      check_out_time: manualStatus === 'Check-Out' ? now.toISOString() : null,
    });

    if (!error) {
      alert('Manual entry logged successfully.');
      setShowManualLog(false);
      setManualNotes('');
      fetchAttendance();
    } else {
      alert('Error logging entry: ' + error.message);
    }
  };

  // Simple CSV Export Logic
  const handleExportCSV = (type: 'daily' | 'weekly' | 'monthly') => {
    let headers = ['Employee Name', 'Department', 'Date', 'Status', 'In Time', 'Out Time', 'Is Late', 'Out of Geofence', 'Notes'];
    let rows = attendance.map(rec => [
      `${rec.profiles?.first_name || ''} ${rec.profiles?.last_name || ''}`,
      rec.profiles?.department || '',
      rec.date,
      rec.status,
      rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString() : '',
      rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString() : '',
      rec.is_late ? 'YES' : 'NO',
      rec.is_out_of_geofence ? 'YES' : 'NO',
      rec.notes || ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NGO_Attendance_Report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(r => r.date === todayStr);
  const totalEmployeesCount = profiles.filter(p => p.is_active).length;
  const presentCount = todayRecords.filter(r => r.status === 'Check-In').length;
  const fieldCount = todayRecords.filter(r => r.status === 'Field Visit').length;
  const leaveCount = todayRecords.filter(r => ['Annual Leave', 'Casual Leave', 'Sick Leave'].includes(r.status)).length;
  const absentCount = Math.max(0, totalEmployeesCount - (presentCount + fieldCount + leaveCount));

  // While loading or redirecting, show a friendly status screen
  if (!isLoaded || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Retrieving NGO master records...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800">Access Restricted</h1>
        <p className="text-slate-600 mt-2 max-w-sm">
          Your credentials do not carry Admin privileges. Please contact the NGO Administration team to elevate your profile.
        </p>
        <div className="mt-6 flex gap-4">
          <a href="/dashboard" className="bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm">
            Employee Portal
          </a>
          <SignOutButton>
            <button className="bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-lg text-sm">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Banner */}
      <header className="bg-slate-900 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-black">
            N
          </div>
          <span className="font-bold text-lg">NGO Dashboard — Admin Oversight</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-300 font-medium bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            System Administrator
          </span>
          <SignOutButton>
            <button className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-md transition-all font-semibold">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-2">
          {[
            { id: 'overview', label: 'Live Headcount', icon: Users },
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'attendance', label: 'Attendance Logs', icon: Calendar },
            { id: 'settings', label: 'Branch Settings', icon: Settings },
            { id: 'reports', label: 'Generate Reports', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Dashboard Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'Present (In-Office)', count: presentCount, color: 'text-emerald-600 border-emerald-100 bg-emerald-50/50' },
                  { title: 'Field / On-Site', count: fieldCount, color: 'text-blue-600 border-blue-100 bg-blue-50/50' },
                  { title: 'Leave Logged', count: leaveCount, color: 'text-amber-600 border-amber-100 bg-amber-50/50' },
                  { title: 'Absent / Unmarked', count: absentCount, color: 'text-rose-600 border-rose-100 bg-rose-50/50' },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between ${stat.color}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.title}</span>
                    <span className="text-3xl font-black mt-2">{stat.count}</span>
                  </div>
                ))}
                  </div>

                  {/* Warnings and Live Logs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Real-time Alerts */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
                      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-rose-500" />
                        <span>Real-Time Alerts</span>
                      </h3>
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No security warnings triggered today.</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg text-xs space-y-1">
                              <div className="flex justify-between items-center font-bold text-rose-900">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-rose-500 font-medium">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-rose-700 leading-relaxed font-sans">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Today's Timeline Log */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                      <h3 className="font-bold text-slate-800 text-sm mb-4">Today's Check-in Log</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                              <th className="py-3">Employee</th>
                              <th className="py-3">Department</th>
                              <th className="py-3">Status</th>
                              <th className="py-3">Timestamp</th>
                              <th className="py-3">Geofence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {todayRecords.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-slate-400 italic text-center">No check-ins recorded yet today.</td>
                              </tr>
                            ) : (
                              todayRecords.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 font-semibold text-slate-800">
                                    {rec.profiles?.first_name} {rec.profiles?.last_name}
                                  </td>
                                  <td className="py-3 text-slate-600">{rec.profiles?.department}</td>
                                  <td className="py-3 font-bold text-slate-700">{rec.status}</td>
                                  <td className="py-3 text-slate-500">
                                    {new Date(rec.check_in_time || rec.check_out_time || rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-3">
                                    {rec.is_out_of_geofence ? (
                                      <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">VIOLATION</span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">OK</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYEE DIRECTORY */}
              {activeTab === 'employees' && (
                <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-base">NGO Employee Directory</h3>
                    <button 
                      onClick={() => setShowAddEmp(!showAddEmp)}
                      className="flex items-center space-x-1 bg-slate-900 text-white font-semibold text-xs py-2 px-4 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Employee</span>
                    </button>
                  </div>

                  {showAddEmp && (
                    <form onSubmit={handleAddEmployee} className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Clerk User ID (or unique handle)</label>
                        <input 
                          value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)}
                          placeholder="e.g. user_abc123" required
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Email Address</label>
                        <input 
                          value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)}
                          placeholder="employee@ngo.org" type="email" required
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">First Name</label>
                        <input 
                          value={newEmpFirst} onChange={(e) => setNewEmpFirst(e.target.value)}
                          placeholder="First Name"
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Last Name</label>
                        <input 
                          value={newEmpLast} onChange={(e) => setNewEmpLast(e.target.value)}
                          placeholder="Last Name"
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Department</label>
                        <input 
                          value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)}
                          placeholder="e.g. Field Ops, Finance"
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">System Role</label>
                        <select 
                          value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value as any)}
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                        >
                          <option value="employee">Employee (standard user)</option>
                          <option value="admin">Administrator (full access)</option>
                        </select>
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <button type="submit" className="bg-emerald-600 text-white font-bold py-2 px-6 rounded shadow">
                          Save Database Profile
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-3">Clerk ID</th>
                          <th className="py-3">Name</th>
                          <th className="py-3">Email Address</th>
                          <th className="py-3">Department</th>
                          <th className="py-3">Role</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profiles.map(p => (
                          <tr key={p.id}>
                            <td className="py-3 font-mono text-slate-500">{p.id}</td>
                            <td className="py-3 font-semibold text-slate-800">{p.first_name} {p.last_name}</td>
                            <td className="py-3 text-slate-600">{p.email}</td>
                            <td className="py-3 text-slate-600">{p.department || 'General'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded font-bold ${p.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>
                                {p.role}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-emerald-600 font-semibold">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ATTENDANCE HISTORY & CORRECTIONS */}
              {activeTab === 'attendance' && (
                <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-base">Attendance Master Log</h3>
                    <button 
                      onClick={() => setShowManualLog(!showManualLog)}
                      className="flex items-center space-x-1 bg-slate-900 text-white font-semibold text-xs py-2 px-4 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manual Attendance Log</span>
                    </button>
                  </div>

                  {showManualLog && (
                    <form onSubmit={handleManualAttendance} className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Select Employee</label>
                        <select 
                          value={manualProfileId} onChange={(e) => setManualProfileId(e.target.value)} required
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                        >
                          <option value="">-- Choose Employee --</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Status</label>
                        <select 
                          value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                        >
                          <option value="Check-In">Check-In</option>
                          <option value="Check-Out">Check-Out</option>
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Field Visit">Field Visit</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Correction Date</label>
                        <input 
                          value={attendanceFilterDate} onChange={(e) => setAttendanceFilterDate(e.target.value)}
                          type="date" required
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="md:col-span-3 flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Note / Reason for Entry</label>
                        <textarea 
                          value={manualNotes} onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="e.g. Employee forgot card, internet failure in the field" required
                          className="border border-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <button type="submit" className="bg-emerald-600 text-white font-bold py-2 px-6 rounded shadow">
                          Log Correction
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by employee name or status..."
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-3">Name</th>
                          <th className="py-3">Department</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">Location Checked</th>
                          <th className="py-3">Accuracy</th>
                          <th className="py-3">Status Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendance
                          .filter(rec => {
                            const name = `${rec.profiles?.first_name || ''} ${rec.profiles?.last_name || ''}`.toLowerCase();
                            const query = searchQuery.toLowerCase();
                            return name.includes(query) || rec.status.toLowerCase().includes(query);
                          })
                          .map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50/20">
                              <td className="py-3 font-semibold text-slate-800">
                                {rec.profiles?.first_name} {rec.profiles?.last_name}
                              </td>
                              <td className="py-3 text-slate-500">{rec.profiles?.department || 'General'}</td>
                              <td className="py-3 font-medium text-slate-600">{rec.date}</td>
                              <td className="py-3 font-bold text-slate-700">{rec.status}</td>
                              <td className="py-3">
                                {rec.check_in_lat ? (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${rec.check_in_lat},${rec.check_in_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-emerald-600 hover:underline font-bold"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Maps Link</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No GPS data</span>
                                )}
                              </td>
                              <td className="py-3 font-mono text-slate-400">{rec.gps_accuracy ? `±${Math.round(rec.gps_accuracy)}m` : 'N/A'}</td>
                              <td className="py-3 space-x-1.5">
                                {rec.is_out_of_geofence && (
                                  <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[10px]">GEOFENCE</span>
                                )}
                                {rec.is_late && (
                                  <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">LATE</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: BRANCH & GEOFENCE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 text-base">Global Branch Configurations</h3>
                  <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Office Latitude</label>
                        <input 
                          value={officeLat} onChange={(e) => setOfficeLat(e.target.value)}
                          placeholder="e.g. 33.6844" type="number" step="any" required
                          className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="font-semibold text-slate-700">Office Longitude</label>
                        <input 
                          value={officeLng} onChange={(e) => setOfficeLng(e.target.value)}
                          placeholder="e.g. 73.0479" type="number" step="any" required
                          className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-700">Allowable Radius (in Meters)</label>
                      <input 
                        value={radius} onChange={(e) => setRadius(e.target.value)}
                        placeholder="e.g. 100" type="number" required
                        className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                        Any check-in placed farther than this distance from coordinates will log a warning notification flag.
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-700">Official Office Start Time</label>
                      <input 
                        value={startTime} onChange={(e) => setStartTime(e.target.value)}
                        type="time" step="1" required
                        className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                        Check-Ins placed past this limit trigger a late registration alert.
                      </p>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors">
                      Save Changes to Settings
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: REPORTS & EXPORTS */}
              {activeTab === 'reports' && (
                <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 text-base">Export Attendance Records</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download structured data logs including timestamps, geofence validations, accuracy levels, and admin corrections compiled cleanly into CSV formats compatible with Excel, Google Sheets, and LibreOffice.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">Daily Log Summary</h4>
                        <p className="text-[10px] text-slate-400">Export active logs for current calendar day.</p>
                      </div>
                      <button onClick={() => handleExportCSV('daily')} className="bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg">
                        Export CSV
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">Weekly Breakdown</h4>
                        <p className="text-[10px] text-slate-400">Export active logs for previous 7 calendar days.</p>
                      </div>
                      <button onClick={() => handleExportCSV('weekly')} className="bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg">
                        Export CSV
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">Monthly Full Registry</h4>
                        <p className="text-[10px] text-slate-400">Export active logs for previous 30 calendar days.</p>
                      </div>
                      <button onClick={() => handleExportCSV('monthly')} className="bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg">
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
  );
}