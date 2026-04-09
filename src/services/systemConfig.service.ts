import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

/**
 * Fetch a configuration value by key.
 */
export async function getConfig(key: string) {
  try {
    const { data, error } = await supabase
      .from('SystemConfig')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('getConfig Error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data?.value || null;
  } catch (err: any) {
    if (err.message?.includes('relation "SystemConfig" does not exist') || err.code === '42P01') {
      const customErr = new Error('Bảng quản trị SystemConfig chưa tồn tại. Vui lòng chạy SQL Migration.');
      (customErr as any).code = 'TABLE_MISSING';
      throw customErr;
    }
    throw err;
  }
}

/**
 * Check if the system is currently in maintenance mode.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const config = await getConfig('maintenance_mode');
    return !!config?.is_maintenance;
  } catch (err) {
    return false; // Fail-safe to OPEN
  }
}

/**
 * Toggle maintenance mode activity.
 */
export async function setMaintenanceMode(enabled: boolean, message: string = 'Hệ thống đang bảo trì định kỳ. Vui lòng quay lại sau.') {
  const value = { 
    is_maintenance: enabled, 
    message, 
    updated_at: new Date().toISOString() 
  };

  try {
    // Definitive Upsert pattern: most resilient to RLS/Sync issues
    const { data, error } = await supabase
      .from('SystemConfig')
      .upsert({ 
        key: 'maintenance_mode', 
        value 
      }, { 
        onConflict: 'key' 
      })
      .select()
      .maybeSingle(); // maybeSingle to avoid PGRST116 if RLS blocks the subsequent SELECT

    if (error) {
      console.error('Upsert Error:', JSON.stringify(error, null, 2));
      throw error;
    }

    // If data is still null (likely due to RLS blocking the returning SELECT), 
    // we assume success but return the value we just tried to set.
    if (!data) {
       console.warn('Upsert worked but no data returned (Check RLS/ServiceRoleKey).');
       return value;
    }

    return data.value;
  } catch (error: any) {
    console.error('setMaintenanceMode Exception:', JSON.stringify(error, null, 2));
    
    if (error.message?.includes('relation "SystemConfig" does not exist') || error.code === '42P01') {
      const customErr = new Error('Bảng quản trị SystemConfig chưa tồn tại. Vui lòng chạy SQL Migration.');
      (customErr as any).code = 'TABLE_MISSING';
      throw customErr;
    }
    
    throw error;
  }
}

/**
 * Realtime subscription to config changes.
 */
export function subscribeToMaintenance(callback: (config: any) => void) {
  console.log('Realtime: Subscribing to SystemConfig changes...');
  
  return supabase
    .channel('system_maintenance_all')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'SystemConfig'
    }, (payload) => {
      console.log('Realtime Config Change:', payload);
      const newData = payload.new as any;
      if (newData && newData.key === 'maintenance_mode') {
        callback(newData.value || {});
      }
    })
    .subscribe((status) => {
      console.log('Realtime Subscription Status:', status);
    });
}
/**
 * Get the milestone template configuration.
 */
export async function getMilestoneTemplate() {
  return getConfig('milestone_template');
}

/**
 * Update the milestone template configuration.
 */
export async function updateMilestoneTemplate(template: any[]) {
  try {
    const { data, error } = await supabase
      .from('SystemConfig')
      .upsert({ 
        key: 'milestone_template', 
        value: template 
      }, { 
        onConflict: 'key' 
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data?.value || template;
  } catch (error) {
    console.error('updateMilestoneTemplate Error:', error);
    throw error;
  }
}
