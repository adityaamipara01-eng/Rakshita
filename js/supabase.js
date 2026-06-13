/* ==========================================================================
   RAKSHIKA — DATABASE LAYER (SUPABASE & MOCK FALLBACK)
   ========================================================================== */

class DatabaseService {
  constructor() {
    this.client = null;
    this.isMock = true;
    this.channel = null;
    this.locChannel = null;
    this.subscribers = [];
    this.locSubscribers = [];
    
    // BroadcastChannel for cross-tab communication when in mock mode
    this.broadcast = new BroadcastChannel('rakshika_realtime_events');
    this.broadcast.onmessage = (event) => {
      this._handleRealtimeEvent(event.data);
    };

    this.init();
  }

  init() {
    const url = localStorage.getItem('rakshika_supabase_url');
    const key = localStorage.getItem('rakshika_supabase_key');

    if (url && key && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key);
        this.isMock = false;
        console.log("Rakshika: Connected to Supabase Cloud Database.");
        this._setupSupabaseSubscription();
      } catch (err) {
        console.error("Rakshika: Supabase init failed. Falling back to local mock.", err);
        this.isMock = true;
      }
    } else {
      this.isMock = true;
      console.log("Rakshika: Running on local mock database. Set Supabase credentials to sync in cloud.");
      this._seedMockData();
    }
  }

  // Set credentials and reload
  setCredentials(url, key) {
    if (url && key) {
      localStorage.setItem('rakshika_supabase_url', url);
      localStorage.setItem('rakshika_supabase_key', key);
    } else {
      localStorage.removeItem('rakshika_supabase_url');
      localStorage.removeItem('rakshika_supabase_key');
    }
    this.init();
    window.location.reload();
  }

  getSettings() {
    return {
      url: localStorage.getItem('rakshika_supabase_url') || '',
      key: localStorage.getItem('rakshika_supabase_key') || '',
      isMock: this.isMock
    };
  }

  isReady() {
    return !this.isMock && this.client !== null;
  }

  /* --- Mock Data Seeding --- */
  _seedMockData() {
    if (!localStorage.getItem('rakshika_mock_incidents')) {
      const defaultIncidents = [
        {
          id: 'inc-1',
          category: 'Suspicious Activity',
          description: 'A group of individuals loitering near the subway exit, harassing passersby.',
          location: 'Metro Station, Sector 62',
          latitude: 28.6253,
          longitude: 77.3732,
          anonymous: true,
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'inc-2',
          category: 'Stalking/Harassment',
          description: 'Followed closely on the way home from work. Safely reached home but wanted to report.',
          location: 'Central Park Main Avenue',
          latitude: 28.6139,
          longitude: 77.2090,
          anonymous: false,
          user_name: 'Priya Sharma',
          status: 'resolved',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];
      localStorage.setItem('rakshika_mock_incidents', JSON.stringify(defaultIncidents));
    }

    if (!localStorage.getItem('rakshika_mock_alerts')) {
      localStorage.setItem('rakshika_mock_alerts', JSON.stringify([]));
    }

    if (!localStorage.getItem('rakshika_mock_location_logs')) {
      localStorage.setItem('rakshika_mock_location_logs', JSON.stringify([]));
    }

    if (!localStorage.getItem('rakshika_mock_guardian_links')) {
      localStorage.setItem('rakshika_mock_guardian_links', JSON.stringify([]));
    }
  }

  /* --- Realtime subscription handlers --- */
  subscribeToSOS(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  subscribeToLocation(callback) {
    this.locSubscribers.push(callback);
    return () => {
      this.locSubscribers = this.locSubscribers.filter(sub => sub !== callback);
    };
  }

  _handleRealtimeEvent(payload) {
    console.log("Received cross-tab event:", payload);
    if (payload.table === 'location_tracking') {
      this.locSubscribers.forEach(callback => callback(payload));
    } else {
      this.subscribers.forEach(callback => callback(payload));
    }
  }

  _setupSupabaseSubscription() {
    if (this.isMock || !this.client) return;

    this.channel = this.client
      .channel('public:sos_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, payload => {
        const eventType = payload.eventType;
        const data = payload.new || payload.old;
        this.subscribers.forEach(callback => callback({ eventType, table: 'sos_alerts', data }));
      })
      .subscribe();

    this.locChannel = this.client
      .channel('public:location_tracking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_tracking' }, payload => {
        const eventType = payload.eventType;
        const data = payload.new;
        this.locSubscribers.forEach(callback => callback({ eventType, table: 'location_tracking', data }));
      })
      .subscribe();
  }

  /* --- SOS Alerts Operations --- */
  async triggerSOS(alert) {
    const payload = {
      id: alert.id || 'sos-' + Math.random().toString(36).substr(2, 9),
      user_id: alert.user_id || 'user-1',
      user_name: alert.user_name || 'Anonymous User',
      user_phone: alert.user_phone || '+91 99999 88888',
      latitude: alert.latitude || 28.6139,
      longitude: alert.longitude || 77.2090,
      status: alert.status || 'active',
      emergency_type: alert.emergency_type || 'normal',
      threat_level: alert.threat_level || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isMock) {
      let alerts = JSON.parse(localStorage.getItem('rakshika_mock_alerts') || '[]');
      alerts.unshift(payload);
      localStorage.setItem('rakshika_mock_alerts', JSON.stringify(alerts));
      
      this.broadcast.postMessage({ eventType: 'INSERT', table: 'sos_alerts', data: payload });
      return { data: payload, error: null };
    } else {
      const { data, error } = await this.client
        .from('sos_alerts')
        .insert([payload])
        .select()
        .single();
      return { data, error };
    }
  }

  async getActiveSOS() {
    if (this.isMock) {
      const alerts = JSON.parse(localStorage.getItem('rakshika_mock_alerts') || '[]');
      const active = alerts.filter(a => a.status !== 'resolved');
      return { data: active, error: null };
    } else {
      const { data, error } = await this.client
        .from('sos_alerts')
        .select('*')
        .neq('status', 'resolved')
        .order('created_at', { ascending: false });
      return { data, error };
    }
  }

  async updateSOSStatus(id, status, extraFields = {}) {
    if (this.isMock) {
      let alerts = JSON.parse(localStorage.getItem('rakshika_mock_alerts') || '[]');
      const index = alerts.findIndex(a => a.id === id);
      if (index !== -1) {
        alerts[index].status = status;
        alerts[index].updated_at = new Date().toISOString();
        if (status === 'resolved') {
          alerts[index].resolved_at = new Date().toISOString();
        }
        Object.assign(alerts[index], extraFields);
        localStorage.setItem('rakshika_mock_alerts', JSON.stringify(alerts));
        
        const updatedData = alerts[index];
        this.broadcast.postMessage({ eventType: 'UPDATE', table: 'sos_alerts', data: updatedData });
        return { data: updatedData, error: null };
      }
      return { data: null, error: 'Alert not found' };
    } else {
      const updateObj = Object.assign({ status, updated_at: new Date().toISOString() }, extraFields);
      if (status === 'resolved') {
        updateObj.resolved_at = new Date().toISOString();
      }
      const { data, error } = await this.client
        .from('sos_alerts')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
  }

  async updateSOSCoordinates(id, latitude, longitude) {
    if (this.isMock) {
      let alerts = JSON.parse(localStorage.getItem('rakshika_mock_alerts') || '[]');
      const index = alerts.findIndex(a => a.id === id);
      if (index !== -1) {
        alerts[index].latitude = latitude;
        alerts[index].longitude = longitude;
        alerts[index].updated_at = new Date().toISOString();
        localStorage.setItem('rakshika_mock_alerts', JSON.stringify(alerts));
        
        const updatedData = alerts[index];
        this.broadcast.postMessage({ eventType: 'UPDATE', table: 'sos_alerts', data: updatedData });
        return { data: updatedData, error: null };
      }
      return { data: null, error: 'Alert not found' };
    } else {
      const { data, error } = await this.client
        .from('sos_alerts')
        .update({ latitude, longitude, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
  }

  /* --- Location Log Operations --- */
  async insertLocationLog(log) {
    const payload = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      session_id: log.session_id,
      latitude: log.latitude,
      longitude: log.longitude,
      accuracy: log.accuracy || null,
      speed: log.speed || null,
      heading: log.heading || null,
      timestamp: new Date().toISOString()
    };

    if (this.isMock) {
      let logs = JSON.parse(localStorage.getItem('rakshika_mock_location_logs') || '[]');
      logs.push(payload);
      localStorage.setItem('rakshika_mock_location_logs', JSON.stringify(logs));
      
      this.broadcast.postMessage({ eventType: 'INSERT', table: 'location_tracking', data: payload });
      return { data: payload, error: null };
    } else {
      const { data, error } = await this.client
        .from('location_tracking')
        .insert([payload])
        .select()
        .single();
      return { data, error };
    }
  }

  async getLocationHistory(sessionId) {
    if (this.isMock) {
      const logs = JSON.parse(localStorage.getItem('rakshika_mock_location_logs') || '[]');
      const filtered = logs.filter(l => l.session_id === sessionId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return { data: filtered, error: null };
    } else {
      const { data, error } = await this.client
        .from('location_tracking')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      return { data, error };
    }
  }

  /* --- Incidents Operations --- */
  async reportIncident(incident) {
    const payload = {
      id: 'inc-' + Math.random().toString(36).substr(2, 9),
      category: incident.category || 'General',
      description: incident.description || '',
      location: incident.location || 'Unknown Location',
      latitude: incident.latitude || 28.6139,
      longitude: incident.longitude || 77.2090,
      anonymous: incident.anonymous === undefined ? true : incident.anonymous,
      user_name: incident.anonymous ? 'Anonymous' : (incident.user_name || 'User'),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (this.isMock) {
      let incidents = JSON.parse(localStorage.getItem('rakshika_mock_incidents') || '[]');
      incidents.unshift(payload);
      localStorage.setItem('rakshika_mock_incidents', JSON.stringify(incidents));
      
      this.broadcast.postMessage({ eventType: 'INCIDENT_INSERT', table: 'incidents', data: payload });
      return { data: payload, error: null };
    } else {
      const { data, error } = await this.client
        .from('incidents')
        .insert([payload])
        .select()
        .single();
      return { data, error };
    }
  }

  async getIncidents() {
    if (this.isMock) {
      const incidents = JSON.parse(localStorage.getItem('rakshika_mock_incidents') || '[]');
      return { data: incidents, error: null };
    } else {
      const { data, error } = await this.client
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    }
  }

  /* --- Guardian Links Operations --- */
  async addGuardianLink(userEmailOrId, guardianEmailOrPhone) {
    if (this.isMock) {
      const users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
      const guardian = users.find(u => u.role === 'guardian' && (u.email === guardianEmailOrPhone || u.phone === guardianEmailOrPhone));
      if (!guardian) {
        return { success: false, error: 'Guardian not found. Please ensure they are registered with this email or phone number.' };
      }
      let links = JSON.parse(localStorage.getItem('rakshika_mock_guardian_links') || '[]');
      const exists = links.find(l => l.user_id === userEmailOrId && l.guardian_id === guardian.email);
      if (exists) {
        return { success: false, error: 'This guardian is already linked to your account.' };
      }
      const newLink = {
        id: 'link-' + Math.random().toString(36).substr(2, 9),
        user_id: userEmailOrId,
        guardian_id: guardian.email,
        status: 'active',
        created_at: new Date().toISOString()
      };
      links.push(newLink);
      localStorage.setItem('rakshika_mock_guardian_links', JSON.stringify(links));
      return { success: true, data: newLink };
    } else {
      try {
        const { data: profiles, error: profileErr } = await this.client
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('role', 'guardian')
          .or(`email.eq.${guardianEmailOrPhone},phone.eq.${guardianEmailOrPhone}`);
        
        if (profileErr) throw profileErr;
        if (!profiles || profiles.length === 0) {
          return { success: false, error: 'Guardian not found. Please ensure they are registered with this email or phone number.' };
        }
        
        const guardianProfile = profiles[0];
        
        const { data: newLink, error: linkErr } = await this.client
          .from('guardian_links')
          .insert([{
            user_id: userEmailOrId,
            guardian_id: guardianProfile.id,
            status: 'active'
          }])
          .select()
          .single();
          
        if (linkErr) {
          if (linkErr.code === '23505') {
            return { success: false, error: 'This guardian is already linked to your account.' };
          }
          throw linkErr;
        }
        return { success: true, data: newLink };
      } catch (err) {
        console.error("Supabase addGuardianLink error:", err);
        return { success: false, error: err.message };
      }
    }
  }

  async getLinkedGuardians(userEmailOrId) {
    if (this.isMock) {
      const links = JSON.parse(localStorage.getItem('rakshika_mock_guardian_links') || '[]');
      const users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
      const userLinks = links.filter(l => l.user_id === userEmailOrId);
      
      const guardians = userLinks.map(l => {
        const g = users.find(u => u.email === l.guardian_id);
        return g ? {
          link_id: l.id,
          id: g.email,
          name: g.name,
          phone: g.phone,
          email: g.email,
          role: g.role
        } : null;
      }).filter(Boolean);
      
      return { data: guardians, error: null };
    } else {
      try {
        const { data, error } = await this.client
          .from('guardian_links')
          .select(`
            id,
            profiles:guardian_id (
              id,
              full_name,
              phone,
              email,
              role
            )
          `)
          .eq('user_id', userEmailOrId);
          
        if (error) throw error;
        
        const guardians = data.map(item => {
          if (!item.profiles) return null;
          return {
            link_id: item.id,
            id: item.profiles.id,
            name: item.profiles.full_name,
            phone: item.profiles.phone,
            email: item.profiles.email,
            role: item.profiles.role
          };
        }).filter(Boolean);
        
        return { data: guardians, error: null };
      } catch (err) {
        console.error("Supabase getLinkedGuardians error:", err);
        return { data: null, error: err.message };
      }
    }
  }

  async getLinkedCivilians(guardianEmailOrId) {
    if (this.isMock) {
      const links = JSON.parse(localStorage.getItem('rakshika_mock_guardian_links') || '[]');
      const users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
      const guardianLinks = links.filter(l => l.guardian_id === guardianEmailOrId);
      
      const civilians = guardianLinks.map(l => {
        const c = users.find(u => u.email === l.user_id);
        return c ? {
          link_id: l.id,
          id: c.email,
          name: c.name,
          phone: c.phone,
          email: c.email,
          role: c.role
        } : null;
      }).filter(Boolean);
      
      return { data: civilians, error: null };
    } else {
      try {
        const { data, error } = await this.client
          .from('guardian_links')
          .select(`
            id,
            profiles:user_id (
              id,
              full_name,
              phone,
              email,
              role
            )
          `)
          .eq('guardian_id', guardianEmailOrId);
          
        if (error) throw error;
        
        const civilians = data.map(item => {
          if (!item.profiles) return null;
          return {
            link_id: item.id,
            id: item.profiles.id,
            name: item.profiles.full_name,
            phone: item.profiles.phone,
            email: item.profiles.email,
            role: item.profiles.role
          };
        }).filter(Boolean);
        
        return { data: civilians, error: null };
      } catch (err) {
        console.error("Supabase getLinkedCivilians error:", err);
        return { data: null, error: err.message };
      }
    }
  }

  async removeGuardianLink(linkId) {
    if (this.isMock) {
      let links = JSON.parse(localStorage.getItem('rakshika_mock_guardian_links') || '[]');
      links = links.filter(l => l.id !== linkId);
      localStorage.setItem('rakshika_mock_guardian_links', JSON.stringify(links));
      return { success: true, error: null };
    } else {
      try {
        const { error } = await this.client
          .from('guardian_links')
          .delete()
          .eq('id', linkId);
        if (error) throw error;
        return { success: true, error: null };
      } catch (err) {
        console.error("Supabase removeGuardianLink error:", err);
        return { success: false, error: err.message };
      }
    }
  }
}

// Global Singleton Instance
window.rakshikaDb = new DatabaseService();
