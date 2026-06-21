'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton, UserButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../lib/supabase';
import { logAttendanceAction } from '../../actions/attendance';
import { 
  Users, Calendar, Settings, FileSpreadsheet, Bell, 
  Loader2, LogOut, Search, MapPin, Check, Edit, Plus, AlertTriangle, Trash2, UserCheck, CheckCircle2, Printer, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // Clerk helper to fetch our secure Supabase token
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'alerts' | 'settings' | 'reports'>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Database States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Search, Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilterDate, setAttendanceFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 50;

  // New Dedicated System Alerts Tab Filtering States
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [alertSearchQuery, setAlertSearchQuery] = useState<string>('');

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

  // Form States (Editing Existing Attendance Log)
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editStatus, setEditingStatus] = useState('');
  const [editNotes, setEditingNotes] = useState('');
  const [editDate, setEditingDate] = useState('');

  // Individual Employee Manual Report States
  const [reportEmployee, setReportEmployee] = useState<any | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'csv' | 'pdf'>('pdf');
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);

  // Automated Admin Check-In Popup States
  const [showAdminCheckInModal, setShowAdminCheckInModal] = useState<boolean>(false);
  const [adminStatus, setAdminStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [adminSubmitting, setAdminSubmitting] = useState<boolean>(false);
  const [adminLocationMsg, setAdminLocationStatus] = useState<string>('');

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
      const email = user?.primaryEmailAddress?.emailAddress || '';
      
      const designatedRole = email.toLowerCase() === 'astishna09@gmail.com' ? 'admin' : 'employee';

      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);

      let { data: profile, error: profError } = await client
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();

      if (!profile) {
        await client.from('profiles').insert({
          id: user?.id,
          email: email,
          first_name: user?.firstName || '',
          last_name: user?.lastName || '',
          role: designatedRole,
          department: 'General',
          is_active: true,
        });
        profile = { role: designatedRole };
      } else if (email.toLowerCase() === 'astishna09@gmail.com' && profile.role !== 'admin') {
        // Enforce main admin elevation
        await client.from('profiles').update({ role: 'admin' }).eq('id', user?.id);
        profile.role = 'admin';
      }

      if (profile.role !== 'admin') {
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

      // CHECK IF ADMIN HAS LOGGED ATTENDANCE TODAY
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: adminLogs } = await client
        .from('attendance_records')
        .select('id')
        .eq('profile_id', user?.id)
        .eq('date', todayStr);

      if (adminLogs && adminLogs.length === 0) {
        setAdminStatus('Check-In');
        setShowAdminCheckInModal(true);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { data } = await client.from('profiles').select('*').order('last_name', { ascending: true });
      if (data) setProfiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { data } = await client
        .from('attendance_records')
        .select('*, profiles(first_name, last_name, email, department)')
        .order('created_at', { ascending: false });
      if (data) setAttendance(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { data } = await client.from('geofence_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings(data);
        setOfficeLat(data.latitude.toString());
        setOfficeLng(data.longitude.toString());
        setRadius(data.radius_meters.toString());
        setStartTime(data.official_start_time);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { data } = await client.from('notifications').select('*').order('created_at', { ascending: false });
      if (data) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Admin Check-In/Out popup
  const handleAdminCheckInSubmit = async () => {
    if (!adminStatus) {
      alert('Please select an attendance status first.');
      return;
    }

    setAdminSubmitting(true);
    setAdminLocationStatus('Accessing browser satellite/GPS sensors...');

    try {
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

      const position = await getBrowserLocation();
      const { latitude, longitude, accuracy } = position.coords;
      setAdminLocationStatus('GPS locked. Sending securely to server...');

      const result = await logAttendanceAction(
        adminStatus,
        latitude,
        longitude,
        accuracy,
        adminNotes
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      alert(`Attendance recorded successfully for "${adminStatus}"!`);
      setShowAdminCheckInModal(false);
      setAdminNotes('');
      setAdminStatus('');
      fetchAttendance();

    } catch (err: any) {
      alert(err.message || 'GPS capture failed.');
    } finally {
      setAdminSubmitting(false);
      setAdminLocationStatus('');
    }
  };

  // Edit existing record triggers
  const startEditingRecord = (record: any) => {
    setEditingRecord(record);
    setEditingStatus(record.status);
    setEditingNotes(record.notes || '');
    setEditingDate(record.date);
  };

  // Submit corrected attendance row
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      
      const { error } = await client
        .from('attendance_records')
        .update({
          status: editStatus,
          notes: editNotes + ' (Edited by Admin)',
          date: editDate
        })
        .eq('id', editingRecord.id);

      if (!error) {
        alert('Attendance log corrected successfully.');
        setEditingRecord(null);
        fetchAttendance();
      } else {
        alert('Failed to correct log: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete attendance row
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this attendance log? This cannot be undone.')) {
      return;
    }

    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      
      const { error } = await client
        .from('attendance_records')
        .delete()
        .eq('id', id);

      if (!error) {
        alert('Attendance log deleted successfully.');
        fetchAttendance();
      } else {
        alert('Failed to delete log: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Individual Report Dialog Setup
  const handleOpenIndividualReportModal = (emp: any) => {
    setReportEmployee(emp);
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setReportStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setReportEndDate(today);
    setReportFormat('pdf');
  };

  // Handle Export of Custom Date-Range Individual Employee Report (PDF or CSV)
  const handleGenerateIndividualReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportEmployee) return;

    try {
      setGeneratingReport(true);
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);

      // Query database for this specific employee across chosen date range
      const { data: records, error } = await client
        .from('attendance_records')
        .select('*')
        .eq('profile_id', reportEmployee.id)
        .gte('date', reportStartDate)
        .lte('date', reportEndDate)
        .order('date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      if (reportFormat === 'csv') {
        // Export individual data as CSV
        let headers = ['Date', 'Status', 'In Time', 'Out Time', 'Is Late', 'Out of Geofence', 'Notes'];
        let rows = (records || []).map(rec => [
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
        link.setAttribute("download", `NGO_Report_${reportEmployee.first_name}_${reportEmployee.last_name}_${reportStartDate}_to_${reportEndDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Export individual data as beautifully designed PDF (using print view)
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Please allow popups to open individual PDF reports.');
          return;
        }

        const totalLogs = records.length;
        const breaches = records.filter(r => r.is_out_of_geofence).length;
        const lates = records.filter(r => r.is_late).length;
        const fields = records.filter(r => r.status === 'Field Visit').length;

        let rowsHtml = records.map(rec => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${rec.date}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${rec.status}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-style: italic; color: #475569; max-width: 220px; word-break: break-all;">${rec.notes || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${rec.is_out_of_geofence ? '#e11d48' : '#059669'};">${rec.is_out_of_geofence ? 'Out of Geofence' : 'OK'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${rec.is_late ? '#d97706' : '#64748b'};">${rec.is_late ? 'Late' : 'On-Time'}</td>
          </tr>
        `).join('');

        const documentContent = `
          <html>
            <head>
              <title>Staff Ledger: ${reportEmployee.first_name} ${reportEmployee.last_name}</title>
              <style>
                body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 24px; background: #fff; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 24px; }
                h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
                p { font-size: 11px; color: #64748b; margin-top: 4px; }
                .grid-stats { display: grid; grid-template-cols: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
                .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
                .stat-title { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; tracking-spacing: 1px; }
                .stat-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 6px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #cbd5e1; }
                footer { position: fixed; bottom: 20px; left: 24px; right: 24px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1 style="font-size: 18px;">Staff Performance Ledger</h1>
                  <p style="margin: 4px 0 0 0;">Employee: <strong>${reportEmployee.first_name} ${reportEmployee.last_name}</strong> (${reportEmployee.email})</p>
                  <p style="margin: 2px 0 0 0;">Department: ${reportEmployee.department || 'General'} | Range Selected: ${reportStartDate} to ${reportEndDate}</p>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 900; color: #059669; font-size: 12px;">NGO Attendance Portal</div>
                  <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Verifiable Cloud Records</div>
                </div>
              </div>

              <div class="grid-stats">
                <div class="stat-card">
                  <div class="stat-title">Total Days Logged</div>
                  <div class="stat-value">${totalLogs}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title">Boundary Breaches</div>
                  <div class="stat-value">${breaches}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title">Late Arrivals</div>
                  <div class="stat-value">${lates}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title">Field Visits</div>
                  <div class="stat-value">${fields}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Notes / Explanation</th>
                    <th>Geofence</th>
                    <th>Punctuality</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic;">No logs recorded for this period.</td></tr>'}
                </tbody>
              </table>

              <footer>
                <span>Generated from Secure cloud ledger. Confidential Internal Report.</span>
                <span>Page 1 of 1</span>
              </footer>

              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(documentContent);
        printWindow.document.close();
      }

      setReportEmployee(null); // Close modal
    } catch (err: any) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Approve a pending admin
  const handleApproveAdmin = async (profileId: string) => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { error } = await client
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profileId);

      if (!error) {
        alert('Administrator request approved successfully.');
        fetchProfiles();
      } else {
        alert('Failed to approve request: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reject / Downgrade to standard employee
  const handleRejectAdmin = async (profileId: string) => {
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { error } = await client
        .from('profiles')
        .update({ role: 'employee' })
        .eq('id', profileId);

      if (!error) {
        alert('User set to Employee role successfully.');
        fetchProfiles();
      } else {
        alert('Failed to adjust role: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { error } = await client
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
    } catch (err) {
      console.error(err);
    }
  };

  // Add Employee Manually
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newEmpEmail) {
      alert('Please provide a unique ID and Email.');
      return;
    }

    try {
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { error } = await client.from('profiles').insert({
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
    } catch (err) {
      console.error(err);
    }
  };

  // Manual Attendance Log
  const handleManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProfileId) {
      alert('Please select an employee.');
      return;
    }

    try {
      const now = new Date();
      const token = await getToken({ template: 'supabase' });
      const client = getSupabaseClient(token);
      const { error } = await client.from('attendance_records').insert({
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
    } catch (err) {
      console.error(err);
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

  // Global PDF Exporter for Daily, Weekly, and Monthly logs
  const handleExportPDF = (type: 'daily' | 'weekly' | 'monthly') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate secure PDF reports.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let title = `NGO Daily Summary Report`;
    let records = [...attendance];

    if (type === 'daily') {
      const todayDateStr = new Date().toISOString().split('T')[0];
      records = attendance.filter(r => r.date === todayDateStr);
    } else if (type === 'weekly') {
      title = `NGO Weekly Attendance Report`;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      records = attendance.filter(r => new Date(r.date) >= sevenDaysAgo);
    } else if (type === 'monthly') {
      title = `NGO Monthly Attendance Ledger`;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      records = attendance.filter(r => new Date(r.date) >= thirtyDaysAgo);
    }

    let rowsHtml = records.map(rec => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">
          ${rec.profiles?.first_name || ''} ${rec.profiles?.last_name || ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${rec.profiles?.department || 'General'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${rec.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${rec.status}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-style: italic; color: #475569; max-width: 180px; word-break: break-all;">
          ${rec.notes || '-'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${rec.is_out_of_geofence ? '#e11d48' : '#059669'};">
          ${rec.is_out_of_geofence ? 'Out of Geofence' : 'OK'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${rec.is_late ? '#d97706' : '#64748b'};">
          ${rec.is_late ? 'Late Arrival' : 'On-Time'}
        </td>
      </tr>
    `).join('');

    const documentContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 24px; background: #fff; }
            header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
            p { font-size: 12px; color: #64748b; margin-top: 4px; }
            .grid-stats { display: grid; grid-template-cols: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
            .stat-title { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; tracking-spacing: 1px; }
            .stat-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #cbd5e1; }
            footer { position: fixed; bottom: 20px; left: 24px; right: 24px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 24px;">
            <div>
              <h1 style="font-size: 20px; font-weight: 900; color: #1e293b;">${title}</h1>
              <p style="margin: 4px 0 0 0; color: #64748b;">NGO Attendance Verification Registry | Generated on ${todayStr}</p>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 900; color: #059669; font-size: 12px;">NGO Attendance Portal</div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Verifiable Cloud Records</div>
            </div>
          </div>

          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-title">Total Logs</div>
              <div class="stat-value">${records.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Boundary Breaches</div>
              <div class="stat-value">${records.filter(r => r.is_out_of_geofence).length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Late Arrivals</div>
              <div class="stat-value">${records.filter(r => r.is_late).length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Field Visits</div>
              <div class="stat-value">${records.filter(r => r.status === 'Field Visit').length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes / Reason</th>
                <th>Geofence</th>
                <th>Punctuality</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic;">No logs recorded for this period.</td></tr>'}
            </tbody>
          </table>

          <footer>
            <span>NGO Attendance Master Registry Report. Confidential.</span>
            <span>Page 1 of 1</span>
          </footer>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(documentContent);
    printWindow.document.close();
  };

  // Calculate stats for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(r => r.date === todayStr);
  const totalEmployeesCount = profiles.filter(p => p.is_active && p.role === 'employee').length;
  const presentCount = todayRecords.filter(r => r.status === 'Check-In').length;
  const fieldCount = todayRecords.filter(r => r.status === 'Field Visit').length;
  const leaveCount = todayRecords.filter(r => ['Annual Leave', 'Casual Leave', 'Sick Leave'].includes(r.status)).length;
  const absentCount = Math.max(0, totalEmployeesCount - (presentCount + fieldCount + leaveCount));

  // Separate Pending Admins
  const pendingAdmins = profiles.filter(p => p.role === 'pending_admin');
  const activeProfiles = profiles.filter(p => p.role !== 'pending_admin');

  // Filter today's alerts only for the Main Overview
  const todayNotifications = notifications.filter(n => 
    new Date(n.created_at).toISOString().split('T')[0] === todayStr
  );

  // Filter system-alerts logs by search query and type
  const filteredNotifications = notifications.filter(n => {
    if (alertTypeFilter !== 'all' && n.type !== alertTypeFilter) return false;
    if (alertSearchQuery && !n.message.toLowerCase().includes(alertSearchQuery.toLowerCase())) return false;
    return true;
  });

  // Group notifications chronologically by Date
  const groupNotificationsByDate = (notifs: any[]) => {
    const groups: { [key: string]: any[] } = {};
    notifs.forEach(n => {
      const dateStr = new Date(n.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(n);
    });
    return groups;
  };
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Filter attendance logs by query
  const filteredAttendance = attendance.filter(rec => {
    const name = `${rec.profiles?.first_name || ''} ${rec.profiles?.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || rec.status.toLowerCase().includes(query) || (rec.notes && rec.notes.toLowerCase().includes(query));
  });

  // Paginate filtered results
  const totalPages = Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAttendance = filteredAttendance.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // While loading, show a friendly status screen
  if (!isLoaded || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#059669] mx-auto" />
          <p className="text-sm text-slate-500 font-semibold">Retrieving NGO master records...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-[#0f172a]">Access Restricted</h1>
        <p className="text-slate-600 mt-2 max-w-sm text-sm">
          Your credentials do not carry Admin privileges. Please contact the NGO Administration team to elevate your profile.
        </p>
        <div className="mt-6 flex gap-4">
          <a href="/dashboard" className="bg-[#059669] text-white font-semibold py-2.5 px-5 rounded-lg text-sm hover:bg-[#047857]">
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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col relative antialiased selection:bg-[#059669]/10 selection:text-[#059669]">
      
      {/* DAILY CHECK-IN MODAL POPUP FOR ADMIN */}
      {showAdminCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full border border-[#cbd5e1] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-[#059669] animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a]">Good Day, Admin!</h3>
              <p className="text-xs text-slate-600 leading-normal mt-1">
                You haven't logged your attendance for today yet. Would you like to log your status now?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Select Status</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {['Check-In', 'Check-Out', 'Field Visit', 'Sick Leave'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAdminStatus(opt)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        adminStatus === opt 
                          ? 'border-[#059669] bg-[#f0fdf4] text-[#059669] ring-2 ring-[#059669]/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Work details, leaving early, etc."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#059669] bg-white text-[#0f172a]"
                />
              </div>

              {adminLocationMsg && (
                <p className="text-[10px] text-amber-600 animate-pulse font-semibold text-center leading-normal">
                  {adminLocationMsg}
                </p>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleAdminCheckInSubmit}
                  disabled={adminSubmitting}
                  className="w-full bg-[#059669] text-white font-bold py-3 rounded-xl hover:bg-[#047857] transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {adminSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Attendance</span>
                </button>

                <button
                  onClick={() => setShowAdminCheckInModal(false)}
                  className="w-full text-slate-400 hover:text-slate-600 text-center text-xs font-semibold py-1 transition-colors cursor-pointer"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL POPUP FOR ADMIN TO CORRECT LOGS */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateRecord} className="bg-white rounded-[24px] p-6 max-w-sm w-full border border-[#cbd5e1] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Correct Attendance Log</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Updating entry for {editingRecord.profiles?.first_name} {editingRecord.profiles?.last_name}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col space-y-1">
                <label className="font-semibold text-slate-600">Date</label>
                <input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditingDate(e.target.value)}
                  required
                  className="border border-[#cbd5e1] p-2.5 rounded-lg bg-[#f8fafc] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-semibold text-slate-600">Status Type</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditingStatus(e.target.value)}
                  required
                  className="border border-[#cbd5e1] p-2.5 rounded-lg bg-[#f8fafc] text-[#0f172a] font-semibold focus:outline-none focus:ring-1 focus:ring-[#059669]"
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
                <label className="font-semibold text-[#475569]">Note / Reason for Modification</label>
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Explain why this correction was made..."
                  required
                  rows={2}
                  className="border border-[#cbd5e1] bg-white p-2.5 rounded-[8px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 text-xs font-semibold pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#059669] hover:bg-[#047857] text-white py-2.5 rounded-xl transition-all shadow cursor-pointer"
              >
                Save Correction
              </button>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#0f172a] py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INDIVIDUAL EMPLOYEE MANUAL DATE RANGE REPORT MODAL */}
      {reportEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleGenerateIndividualReport} className="bg-white rounded-[24px] p-6 max-w-sm w-full border border-[#cbd5e1] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Generate Staff Report</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Creating manual date ledger for {reportEmployee.first_name} {reportEmployee.last_name}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="font-semibold text-slate-600">Start Date</label>
                  <input 
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    required
                    className="border border-[#cbd5e1] p-2.5 rounded-lg bg-[#f8fafc] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-semibold text-slate-600">End Date</label>
                  <input 
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    required
                    className="border border-[#cbd5e1] p-2.5 rounded-lg bg-[#f8fafc] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-semibold text-slate-600">Export Format</label>
                <div className="flex border border-[#cbd5e1] rounded-lg overflow-hidden font-bold">
                  <button
                    type="button"
                    onClick={() => setReportFormat('pdf')}
                    className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                      reportFormat === 'pdf' 
                        ? 'bg-[#059669] text-white shadow-inner' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Printable PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFormat('csv')}
                    className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                      reportFormat === 'csv' 
                        ? 'bg-[#059669] text-white shadow-inner' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    CSV File
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 text-xs font-semibold pt-2">
              <button
                type="submit"
                disabled={generatingReport}
                className="flex-1 bg-[#059669] text-white py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {generatingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Generate Export</span>
              </button>
              <button
                type="button"
                onClick={() => setReportEmployee(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#0f172a] py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top Banner: Crisp White Navbar */}
      <header className="bg-[#ffffff] text-[#0f172a] py-4 px-6 flex justify-between items-center shadow-sm border-b border-[#cbd5e1]/60 z-35">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <span className="font-bold text-lg text-[#0f172a]">NGO Dashboard — Admin Oversight</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setAdminStatus('Check-In');
              setShowAdminCheckInModal(true);
            }}
            className="flex items-center space-x-1.5 text-xs bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-1.5 rounded-[5px] transition-all font-bold shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Attendance</span>
          </button>
          
          {/* Clerk Native Account Management UserButton integration! */}
          <div className="w-8 h-8 rounded-full border border-[#cbd5e1] overflow-hidden flex items-center justify-center shadow-inner">
            <UserButton 
              appearance={{
                variables: {
                  colorPrimary: "#059669",
                  colorBackground: "#ffffff",
                  colorForeground: "#0f172a",
                },
                elements: {
                  avatarBox: "w-8 h-8 rounded-full",
                  userButtonPopoverCard: "bg-[#ffffff] border border-[#cbd5e1] text-[#0f172a] rounded-[16px] shadow-2xl",
                }
              }}
            />
          </div>

          <span className="text-xs text-[#0f172a] font-medium bg-[#f8fafc] px-3 py-1.5 rounded-full border border-[#cbd5e1]">
            System Administrator
          </span>
          <SignOutButton>
            <button className="flex items-center space-x-1.5 text-xs bg-[#f8fafc] hover:bg-slate-100 border border-[#cbd5e1] text-slate-700 px-3 py-1.5 rounded-md transition-all font-semibold cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row bg-[#f8fafc]">
        {/* Sidebar Tabs: Pure White Sidebar */}
        <aside className="w-full md:w-64 bg-[#ffffff] border-r border-[#cbd5e1]/60 flex flex-col p-4 space-y-2 shadow-sm">
          {[
            { id: 'overview', label: 'Live Headcount', icon: Users },
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'attendance', label: 'Attendance Logs', icon: Calendar },
            { id: 'alerts', label: 'System Alerts', icon: Bell }, // New Dedicated Alerts History Tab!
            { id: 'settings', label: 'Branch Settings', icon: Settings },
            { id: 'reports', label: 'Generate Reports', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-[5px] transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#f0fdf4] border border-[#bcf0da] text-[#059669] shadow-sm'
                    : 'text-[#475569] hover:bg-slate-50'
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
            <div className="space-y-8 animate-fade-in">
              {/* Stat Row: Rounded cards with subtle shadows */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'Present (In-Office)', count: presentCount, color: 'text-emerald-600 border-emerald-100 bg-[#f0fdf4] shadow-sm' },
                  { title: 'Field / On-Site', count: fieldCount, color: 'text-blue-600 border-blue-100 bg-blue-50/50 shadow-sm' },
                  { title: 'Leave Logged', count: leaveCount, color: 'text-amber-600 border-amber-100 bg-amber-50/50 shadow-sm' },
                  { title: 'Absent / Unmarked', count: absentCount, color: 'text-rose-600 border-rose-100 bg-rose-50/50 shadow-sm' },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-[16px] border bg-[#ffffff] flex flex-col justify-between ${stat.color}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">{stat.title}</span>
                    <span className="text-3xl font-black mt-2 leading-none">{stat.count}</span>
                  </div>
                ))}
              </div>

              {/* Warnings and Live Logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Real-time Alerts: FILTERS AND DISPLAYS TODAY ONLY */}
                <div className="bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm md:col-span-1">
                  <h3 className="font-bold text-rose-600 text-sm mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span>Real-Time Today's Alerts</span>
                  </h3>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {todayNotifications.length === 0 ? (
                      <p className="text-xs text-[#475569] italic">No warnings triggered yet today.</p>
                    ) : (
                      todayNotifications.map(n => (
                        <div key={n.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1 animate-in fade-in">
                          <div className="flex justify-between items-center font-bold text-rose-950">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-rose-600 font-semibold">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-rose-800 leading-relaxed font-sans">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Today's Timeline Log */}
                <div className="bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm md:col-span-2">
                  <h3 className="font-bold text-[#0f172a] text-sm mb-4">Today's Check-in Log</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#cbd5e1] text-[#475569] uppercase tracking-wider font-semibold">
                          <th className="py-3">Employee</th>
                          <th className="py-3">Department</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">Timestamp</th>
                          <th className="py-3">Geofence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cbd5e1]/40">
                        {todayRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-slate-400 italic text-center">No check-ins recorded yet today.</td>
                          </tr>
                        ) : (
                          todayRecords.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="py-3 font-semibold text-[#0f172a]">
                                {rec.profiles?.first_name} {rec.profiles?.last_name}
                              </td>
                              <td className="py-3 text-[#475569]">{rec.profiles?.department}</td>
                              <td className="py-3 font-bold text-[#0f172a]">{rec.status}</td>
                              <td className="py-3 text-slate-500">
                                {new Date(rec.check_in_time || rec.check_out_time || rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3">
                                {rec.is_out_of_geofence ? (
                                  <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">VIOLATION</span>
                                ) : (
                                  <span className="bg-emerald-50 border border-emerald-200 text-[#059669] font-bold px-2 py-0.5 rounded text-[10px]">OK</span>
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

          {/* TAB 2: EMPLOYEE DIRECTORY & APPROVALS */}
          {activeTab === 'employees' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* PENDING APPROVALS SECTION */}
              {pendingAdmins.length > 0 && (
                <div className="space-y-4 bg-amber-50 p-6 rounded-[16px] border border-amber-200 shadow-sm">
                  <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Pending Administrator Approvals ({pendingAdmins.length})</span>
                  </h3>
                  <p className="text-xs text-amber-700 leading-normal">
                    These users selected "Administrator" at registration. They will have no system access until you approve their elevation.
                  </p>
                  <div className="overflow-x-auto bg-[#ffffff] rounded-lg border border-[#cbd5e1]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#cbd5e1] text-[#475569] bg-slate-50 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cbd5e1]/40">
                        {pendingAdmins.map(p => (
                          <tr key={p.id}>
                            <td className="py-3 px-4 font-bold text-[#0f172a]">{p.first_name} {p.last_name}</td>
                            <td className="py-3 px-4 font-mono text-[#475569]">{p.email}</td>
                            <td className="py-3 px-4 space-x-2">
                              <button 
                                onClick={() => handleApproveAdmin(p.id)}
                                className="inline-flex items-center space-x-1 bg-[#059669] hover:bg-[#047857] text-white font-bold py-1.5 px-3.5 rounded-[5px] text-[10px] cursor-pointer shadow-sm"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Approve Admin</span>
                              </button>
                              <button 
                                onClick={() => handleRejectAdmin(p.id)}
                                className="inline-flex items-center space-x-1 bg-[#f8fafc] border border-[#cbd5e1] text-slate-700 font-bold py-1.5 px-3 rounded-[5px] text-[10px] cursor-pointer"
                              >
                                <span>Set to Employee</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DIRECTORY SECTION */}
              <div className="space-y-6 bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#0f172a] text-base">NGO Employee Directory</h3>
                  <button 
                    onClick={() => setShowAddEmp(!showAddEmp)}
                    className="flex items-center space-x-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs py-2 px-4 rounded-[5px] transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Employee Manual</span>
                  </button>
                </div>

                {showAddEmp && (
                  <form onSubmit={handleAddEmployee} className="p-4 bg-[#f8fafc] rounded-[16px] border border-[#cbd5e1] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">Clerk User ID (or unique handle)</label>
                      <input 
                        value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)}
                        placeholder="e.g. user_abc123" required
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">Email Address</label>
                      <input 
                        value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)}
                        placeholder="employee@ngo.org" type="email" required
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">First Name</label>
                      <input 
                        value={newEmpFirst} onChange={(e) => setNewEmpFirst(e.target.value)}
                        placeholder="First Name"
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">Last Name</label>
                      <input 
                        value={newEmpLast} onChange={(e) => setNewEmpLast(e.target.value)}
                        placeholder="Last Name"
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">Department</label>
                      <input 
                        value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)}
                        placeholder="e.g. Field Ops, Finance"
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-semibold text-slate-600">System Role</label>
                      <select 
                        value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value as any)}
                        className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] font-semibold focus:outline-none"
                      >
                        <option value="employee">Employee (standard user)</option>
                        <option value="admin">Administrator (full access)</option>
                      </select>
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button type="submit" className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2 px-6 rounded-[5px] shadow cursor-pointer transition-all">
                        Save Database Profile
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#cbd5e1] text-[#475569] uppercase tracking-wider font-semibold">
                        <th className="py-3">Name</th>
                        <th className="py-3">Email Address</th>
                        <th className="py-3">Department</th>
                        <th className="py-3">Role</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 text-center">Reports (Range)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#cbd5e1]/40">
                      {activeProfiles.map(p => (
                        <tr key={p.id}>
                          <td className="py-3 font-semibold text-[#0f172a]">{p.first_name} {p.last_name}</td>
                          <td className="py-3 text-[#475569] font-mono">{p.email}</td>
                          <td className="py-3 text-[#475569]">{p.department || 'General'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-[5px] font-bold ${p.role === 'admin' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-slate-100 border border-[#cbd5e1] text-slate-700'}`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-emerald-600 font-semibold">Active</span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleOpenIndividualReportModal(p)}
                              className="bg-[#f8fafc] border border-[#cbd5e1] hover:border-[#059669]/50 hover:bg-[#f0fdf4] text-slate-700 font-bold py-1.5 px-3 rounded-[5px] text-[10px] inline-flex items-center space-x-1 transition-all duration-200 cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-[#059669]" />
                              <span>Generate Report</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY, PAGINATION & CORRECTIONS */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#059669] text-base">Attendance Master Log</h3>
                <button 
                  onClick={() => setShowManualLog(!showManualLog)}
                  className="flex items-center space-x-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs py-2 px-4 rounded-[5px] transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Attendance Log</span>
                </button>
              </div>

              {showManualLog && (
                <form onSubmit={handleManualAttendance} className="p-4 bg-[#f8fafc] rounded-[16px] border border-[#cbd5e1] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
                  <div className="flex flex-col space-y-1">
                    <label className="font-semibold text-slate-600">Select Employee</label>
                    <select 
                      value={manualProfileId} 
                      onChange={(e) => setManualProfileId(e.target.value)} required
                      className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] font-semibold focus:outline-none"
                    >
                      <option value="">-- Choose Employee --</option>
                      {activeProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-semibold text-slate-600">Status</label>
                    <select 
                      value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}
                      className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] font-semibold focus:outline-none"
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
                    <label className="font-semibold text-slate-600">Correction Date</label>
                    <input 
                      value={attendanceFilterDate} onChange={(e) => setAttendanceFilterDate(e.target.value)}
                      type="date" required
                      className="border border-[#cbd5e1] bg-[#f8fafc] p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-3 flex flex-col space-y-1">
                    <label className="font-semibold text-slate-600">Note / Reason for Entry</label>
                    <textarea 
                      value={manualNotes} onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="e.g. Employee forgot card, internet failure in the field" required
                      className="border border-[#cbd5e1] bg-white p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button type="submit" className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2 px-6 rounded-[5px] shadow cursor-pointer">
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to page 1 on new search
                    }}
                    placeholder="Search by employee name or status..."
                    className="pl-9 pr-4 py-2 border border-[#cbd5e1] rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#059669] bg-[#ffffff] text-[#0f172a]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#cbd5e1] text-[#475569] uppercase tracking-wider font-semibold">
                      <th className="py-3">Name</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Note / Reason</th>
                      <th className="py-3">Location Checked</th>
                      <th className="py-3">Accuracy</th>
                      <th className="py-3">Status Flags</th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cbd5e1]/40">
                    {paginatedAttendance.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-[#0f172a]">
                          {rec.profiles?.first_name} {rec.profiles?.last_name}
                        </td>
                        <td className="py-3 text-slate-500">{rec.profiles?.department || 'General'}</td>
                        <td className="py-3 font-medium text-slate-600">{rec.date}</td>
                        <td className="py-3 font-bold text-[#0f172a]">{rec.status}</td>
                        <td className="py-3 text-slate-600 italic max-w-xs truncate" title={rec.notes}>
                          {rec.notes || <span className="text-slate-400 italic">No notes added</span>}
                        </td>
                        <td className="py-3">
                          {rec.check_in_lat ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${rec.check_in_lat},${rec.check_in_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[#059669] hover:underline font-bold"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Maps Link</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No GPS data</span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-slate-500">{rec.gps_accuracy ? `±${Math.round(rec.gps_accuracy)}m` : 'N/A'}</td>
                        <td className="py-3 space-x-1.5">
                          {rec.is_out_of_geofence && (
                            <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">GEOFENCE</span>
                          )}
                          {rec.is_late && (
                            <span className="bg-amber-50 border border-amber-200 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[10px]">LATE</span>
                          )}
                        </td>
                        <td className="py-3 text-center space-x-2">
                          <button
                            onClick={() => startEditingRecord(rec)}
                            className="p-1 text-slate-500 hover:text-[#059669] hover:bg-emerald-50 rounded transition-all inline-flex cursor-pointer"
                            title="Edit / Correct record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all inline-flex cursor-pointer"
                            title="Delete log permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABLE PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#cbd5e1] pt-4 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAttendance.length)} of {filteredAttendance.length} entries
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-[#cbd5e1] rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[#0f172a]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          currentPage === pageNum 
                            ? 'bg-[#059669] border-[#059669] text-white shadow-sm' 
                            : 'border-[#cbd5e1] hover:bg-slate-50 text-[#475569]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-[#cbd5e1] rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[#0f172a]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NEW HISTORICAL SYSTEM ALERTS & SEARCH PANEL */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#cbd5e1]/40 pb-4">
                <div>
                  <h3 className="font-bold text-[#0f172a] text-base flex items-center gap-2">
                    <Bell className="w-5 h-5 text-rose-500" />
                    <span>System Warnings Master Ledger</span>
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed mt-1">
                    Review and audit all historical out-of-geofence breaches and late arrivals logged across the organization.
                  </p>
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-1.5 text-xs font-semibold text-slate-700">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={alertTypeFilter}
                      onChange={(e) => setAlertTypeFilter(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold cursor-pointer outline-none"
                    >
                      <option value="all">All Warnings</option>
                      <option value="late_checkin">Late Arrivals Only</option>
                      <option value="out_of_geofence">Geofence Breaches Only</option>
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      value={alertSearchQuery}
                      onChange={(e) => setAlertSearchQuery(e.target.value)}
                      placeholder="Search alerts by employee name..."
                      className="pl-8 pr-4 py-1.5 border border-[#cbd5e1] rounded-lg text-xs w-64 bg-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                    />
                  </div>
                </div>
              </div>

              {/* Grouped Alert Log Content */}
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                {Object.keys(groupedNotifications).length === 0 ? (
                  <p className="text-xs text-[#475569] italic text-center py-8">No alerts matches your filter criteria.</p>
                ) : (
                  Object.keys(groupedNotifications).map(dateStr => (
                    <div key={dateStr} className="space-y-3">
                      {/* Date Heading: Whispering, clean ledger format */}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#cbd5e1]/30 pb-1 pt-2">
                        {dateStr}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedNotifications[dateStr].map((n: any) => (
                          <div 
                            key={n.id} 
                            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all bg-[#ffffff] ${
                              n.type === 'out_of_geofence' 
                                ? 'border-rose-100 bg-rose-50/20 text-rose-950' 
                                : 'border-amber-100 bg-amber-50/20 text-amber-950'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                                {n.type === 'out_of_geofence' ? 'Geofence Breach' : 'Late Arrival'}
                              </span>
                              <span className="text-[10px] font-semibold opacity-50">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed font-sans">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BRANCH & GEOFENCE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm space-y-6">
              <h3 className="font-bold text-[#0f172a] text-base">Global Branch Configurations</h3>
              <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="font-semibold text-slate-600">Office Latitude</label>
                    <input 
                      value={officeLat} onChange={(e) => setOfficeLat(e.target.value)}
                      placeholder="e.g. 33.6844" type="number" step="any" required
                      className="border border-[#cbd5e1] bg-[#f8fafc] p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669] font-mono"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-semibold text-slate-600">Office Longitude</label>
                    <input 
                      value={officeLng} onChange={(e) => setOfficeLng(e.target.value)}
                      placeholder="e.g. 73.0479" type="number" step="any" required
                      className="border border-[#cbd5e1] bg-[#f8fafc] p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669] font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="font-semibold text-[#0f172a]">Allowable Radius (in Meters)</label>
                  <input 
                    value={radius} onChange={(e) => setRadius(e.target.value)}
                    placeholder="e.g. 100" type="number" required
                    className="border border-[#cbd5e1] bg-[#f8fafc] p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669] font-mono"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Any check-in placed farther than this distance from coordinates will log a warning notification flag.
                  </p>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="font-semibold text-[#0f172a]">Official Office Start Time</label>
                  <input 
                    value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    type="time" step="1" required
                    className="border border-[#cbd5e1] bg-[#f8fafc] p-2.5 rounded-[5px] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#059669] font-mono"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Check-Ins placed past this limit trigger a late registration alert.
                  </p>
                </div>

                <button type="submit" className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-3 rounded-[5px] shadow cursor-pointer transition-all">
                  Save Changes to Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: REPORTS & EXPORTS */}
          {activeTab === 'reports' && (
            <div className="max-w-xl bg-[#ffffff] p-6 rounded-[16px] border border-[#cbd5e1]/60 shadow-sm space-y-6">
              <h3 className="font-bold text-[#0f172a] text-base">Export Attendance Records</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Download structured data logs including timestamps, geofence validations, accuracy levels, and admin corrections compiled cleanly into CSV formats compatible with Excel, Google Sheets, and LibreOffice.
              </p>
              
              <div className="grid grid-cols-1 gap-4 text-xs">
                {/* Daily export summary row: FIXED CONTRAST TO DEEP SLATE-900 */}
                <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[16px] flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-[#0f172a]">Daily Log Summary</h4>
                    <p className="text-[10px] text-[#475569]">Export active logs for current calendar day.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleExportCSV('daily')} className="bg-[#ffffff] hover:bg-slate-100 border border-[#cbd5e1] text-slate-700 font-semibold py-2 px-4 rounded-[5px] transition-colors cursor-pointer">
                      CSV
                    </button>
                    <button onClick={() => handleExportPDF('daily')} className="bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2 px-4 rounded-[5px] flex items-center space-x-1.5 transition-colors cursor-pointer">
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Weekly export summary row: FIXED CONTRAST TO DEEP SLATE-900 */}
                <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[16px] flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-[#0f172a]">Weekly Breakdown</h4>
                    <p className="text-[10px] text-[#475569]">Export active logs for previous 7 calendar days.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleExportCSV('weekly')} className="bg-[#ffffff] hover:bg-slate-100 border border-[#cbd5e1] text-slate-700 font-semibold py-2 px-4 rounded-[5px] transition-colors cursor-pointer">
                      CSV
                    </button>
                    <button onClick={() => handleExportPDF('weekly')} className="bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2 px-4 rounded-[5px] flex items-center space-x-1.5 transition-colors cursor-pointer">
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Monthly export summary row: FIXED CONTRAST TO DEEP SLATE-900 */}
                <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[16px] flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-[#0f172a]">Monthly Full Registry</h4>
                    <p className="text-[10px] text-[#475569]">Export active logs for previous 30 calendar days.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleExportCSV('monthly')} className="bg-[#ffffff] hover:bg-slate-100 border border-[#cbd5e1] text-slate-700 font-semibold py-2 px-4 rounded-[5px] transition-colors cursor-pointer">
                      CSV
                    </button>
                    <button onClick={() => handleExportPDF('monthly')} className="bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2 px-4 rounded-[5px] flex items-center space-x-1.5 transition-colors cursor-pointer">
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}