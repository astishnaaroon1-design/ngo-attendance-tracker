'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { calculateDistance, checkIfLate } from '../lib/geofence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This is a secure server action that runs 100% on the cloud (Vercel)
export async function logAttendanceAction(
  status: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  notes: string
) {
  try {
    // 1. Verify User Session Securely on the Server
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return { success: false, error: 'Unauthorized: You must be logged in.' };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const firstName = clerkUser.firstName || '';
    const lastName = clerkUser.lastName || '';
    
    // Automatically elevate main admin, others standard employees
    const designatedRole = email.toLowerCase() === 'astishna09@gmail.com' ? 'admin' : 'employee';

    // 2. Connect to Supabase using our secret Service Role (bypassing RLS for secure inserts)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Ensure profile row exists in Supabase
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: designatedRole,
        department: 'General',
        is_active: true,
      });
    }

    // 4. Download Geofencing parameters directly from database settings
    const { data: config, error: configError } = await supabaseAdmin
      .from('geofence_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !config) {
      return { success: false, error: 'Failed to retrieve geofencing boundary coordinates.' };
    }

    // 5. Calculate parameters SECURELY on the Server
    const distanceInMeters = calculateDistance(latitude, longitude, config.latitude, config.longitude);
    const isOutOfGeofence = distanceInMeters > config.radius_meters;

    const now = new Date(); // Master Server Clock
    let isLate = false;

    if (status === 'Check-In') {
      isLate = checkIfLate(now, config.official_start_time);
    }

    // Suppress alerts for Field Visits
    const finalGeofenceAlert = (status === 'Field Visit') ? false : isOutOfGeofence;

    // 6. Write the final secure logs to Supabase
    const recordPayload: any = {
      profile_id: userId,
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

    const { error: insertError } = await supabaseAdmin
      .from('attendance_records')
      .insert([recordPayload]);

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: false, error: `You have already logged your "${status}" status for today.` };
      }
      return { success: false, error: insertError.message };
    }

    // 7. Write triggered alerts to Notifications
    if (isLate) {
      await supabaseAdmin.from('notifications').insert({
        profile_id: userId,
        type: 'late_checkin',
        title: 'Late Arrival Logged',
        message: `${firstName} ${lastName} checked in late at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    if (finalGeofenceAlert) {
      await supabaseAdmin.from('notifications').insert({
        profile_id: userId,
        type: 'out_of_geofence',
        title: 'Out of Geofence Check-in',
        message: `${firstName} ${lastName} logged attendance ${Math.round(distanceInMeters)}m away from the office.`
      });
    }

    return { 
      success: true, 
      isOutOfGeofence: finalGeofenceAlert, 
      isLate 
    };

  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message || 'Server action failed.' };
  }
}