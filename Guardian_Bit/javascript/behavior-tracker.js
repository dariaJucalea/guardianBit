
class BehaviorTracker {
  constructor() {
    this.currentSession = null;
    this.sessionStart = null;
    this.lastAlertCheck = Date.now();
    this.isTracking = false;
    this.isActive = false;
    this.debugMode = true;
    this.userId = null;
    this.token = null;
    this.alertedSessions = new Set();

    this.config = {
      longVisitMultiplier: 1.5, 
      nightHoursStart: 23,
      nightHoursEnd: 6,
      riskTimeThresholdHours: 2,
      alertInterval: 30 * 1000,
      dataRetentionDays: 30,
      minSessionsForAlert: 3, 
       cleanOldFrequentSites: true
    };

    this.siteCategories = {
      social: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'snapchat.com'],
      work: ['gmail.com', 'outlook.com', 'slack.com', 'teams.microsoft.com', 'zoom.us', 'notion.so', 'asana.com'],
      entertainment: ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'hbo.com', 'disneyplus.com'],
      gaming: ['steam.com', 'epicgames.com', 'roblox.com', 'minecraft.net', 'leagueoflegends.com', 'battlenet.com'],
      shopping: ['amazon.com', 'ebay.com', 'aliexpress.com', 'emag.ro', 'cora.ro', 'carrefour.ro', 'decathlon.ro'],
      news: ['cnn.com', 'bbc.com', 'nytimes.com', 'hotnews.ro', 'digi24.ro', 'g4media.ro', 'euronews.com'],
      education: ['wikipedia.org', 'khanacademy.org', 'coursera.org', 'udemy.com', 'edx.org', 'codecademy.com', 'chatgpt.com', 'claude.ai'],
      finance: ['paypal.com', 'revolut.com', 'ing.ro', 'raiffeisen.ro', 'bnr.ro', 'banca-transilvania.ro'],
      health: ['webmd.com', 'mayoclinic.org', 'healthline.com', 'medlife.ro', 'reginamaria.ro'],
      adult: ['pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com', 'youporn.com'],
      gambling: ['betano.ro', 'superbet.ro', 'unibet.ro', 'pokerstars.com', '888poker.com']
    };

    this.riskCategories = ['adult', 'gambling'];
    this.alerts = [];
    this._log('BehaviorTracker initialized');
  }

  _log(msg, data = null) {
    if (this.debugMode) console.log(`[Tracker] ${msg}`, data || '');
  }

  _error(msg, err = null) {
    console.error(`[Tracker ERROR] ${msg}`, err || '');
  }

    _ensureDataStructure(data) {
    if (!data.siteStats) data.siteStats = {};
    if (!data.userProfile) data.userProfile = {};
    if (!data.sessions) data.sessions = [];
    return data;
  }

  async init(userId, token) {
    if (!userId || !token) return false;
    this.userId = userId;
    this.token = token;
    this.isTracking = true;
    this.isActive = true;

    this.alertInterval = setInterval(() => {
      this.processAlerts().catch(e => this._error('Alert check failed', e));
    }, this.config.alertInterval);

    this._log('Tracker ready');
    return true;
  }

  startSession(url, tabId = null) {
    try {
     
      if (this.currentSession) {
        this.endSession();
      }

      const domain = new URL(url).hostname;
      this.currentSession = {
        domain,
        url,
        startTime: Date.now(),
        category: this.categorizeUrl(domain),
        tabId
      };
      this._log('Session started', this.currentSession);
    } catch (e) {
      this._error('Start session failed', e);
    }
  }

  endSession() {
    if (!this.currentSession) return;
    const now = Date.now();
    const sessionData = {
      ...this.currentSession,
      endTime: now,
      duration: now - this.currentSession.startTime
    };
    this.saveSessionData(sessionData);
    this.currentSession = null;
  }

  categorizeUrl(domain) {
    const clean = domain.toLowerCase();
    for (const [cat, list] of Object.entries(this.siteCategories)) {
      if (list.some(site => clean.includes(site))) return cat;
    }
    return 'other';
  }

  async saveSessionData(sessionData) {
    const result = await chrome.storage.local.get('behaviorData');
    let data = result.behaviorData || { 
      sessions: [], 
      userProfile: {},
      siteStats: {} 
    };
    
    
    data = this._ensureDataStructure(data);
    
    data.sessions.push(sessionData);

   
    const prof = data.userProfile;
    const hour = new Date().getHours();

    prof.typicalHours = prof.typicalHours || {};
    prof.typicalHours[hour] = (prof.typicalHours[hour] || 0) + 1;

    prof.averageSessionTime = prof.averageSessionTime
      ? (prof.averageSessionTime + sessionData.duration) / 2
      : sessionData.duration;

    prof.frequentSites = prof.frequentSites || {};
    prof.frequentSites[sessionData.domain] = (prof.frequentSites[sessionData.domain] || 0) + 1;

   
    await this.updateSiteStats(data, sessionData);

  
    const cutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
    data.sessions = data.sessions.filter(s => s.startTime > cutoff);

  
    Object.keys(data.siteStats).forEach(domain => {
      if (data.siteStats[domain].lastUpdated < cutoff) {
        delete data.siteStats[domain];
      }
    });
    if (this.config.cleanOldFrequentSites && data.userProfile.frequentSites) {
  const activeDomains = new Set(data.sessions.map(s => s.domain));
  const newFrequentSites = {};
  
  Object.entries(data.userProfile.frequentSites).forEach(([domain, count]) => {
    if (activeDomains.has(domain)) {
      
      newFrequentSites[domain] = data.sessions.filter(s => s.domain === domain).length;
    }
  });
  
  data.userProfile.frequentSites = newFrequentSites;
  this._log(`Cleaned frequent sites: kept ${Object.keys(newFrequentSites).length} active domains`);
}

    await chrome.storage.local.set({ behaviorData: data });
    this._log('Session saved with site stats updated');
  }


  async updateSiteStats(data, sessionData) {
    const { domain, duration } = sessionData;
    const cutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
    
   
    if (!data.siteStats[domain]) {
      data.siteStats[domain] = {
        maxSessionDuration: 0,
        averageSessionDuration: 0,
        totalSessions: 0,
        sessionDurations: [],
        lastUpdated: Date.now()
      };
    }

    const siteStats = data.siteStats[domain];
    

    if (duration > siteStats.maxSessionDuration) {
      siteStats.maxSessionDuration = duration;
      this._log(`New max session for ${domain}: ${(duration / 60000).toFixed(1)} minutes`);
    }


    siteStats.sessionDurations.push(duration);
    

    siteStats.sessionDurations = siteStats.sessionDurations.filter((_, index) => {
      const sessionAge = Date.now() - (siteStats.sessionDurations.length - index) * 24 * 60 * 60 * 1000;
      return sessionAge > cutoff;
    });

  
    if (siteStats.sessionDurations.length > 0) {
      siteStats.averageSessionDuration = siteStats.sessionDurations.reduce((a, b) => a + b, 0) / siteStats.sessionDurations.length;
    }

   
    siteStats.totalSessions = siteStats.sessionDurations.length;
    siteStats.lastUpdated = Date.now();

    this._log(`Site stats updated for ${domain}:`, {
      max: (siteStats.maxSessionDuration / 60000).toFixed(1) + 'min',
      avg: (siteStats.averageSessionDuration / 60000).toFixed(1) + 'min',
      total: siteStats.totalSessions
    });
  }

  async processAlerts() {
    if (!this.isTracking || !this.currentSession) return;

    const now = Date.now();
    const { domain, startTime, category } = this.currentSession;
    const duration = now - startTime;

    const sessionKey = `${domain}-${startTime}`;
    if (this.alertedSessions.has(sessionKey)) {
      return; 
    }

    const result = await chrome.storage.local.get('behaviorData');
    let data = result.behaviorData;
    if (!data || !data.userProfile) return;

    
    data = this._ensureDataStructure(data);

    const alerts = [];
    const profile = data.userProfile;
    const siteStats = data.siteStats[domain];

   
    if (siteStats && siteStats.totalSessions >= this.config.minSessionsForAlert) {
    
      const siteMaxDuration = siteStats.maxSessionDuration;
      const siteAvgDuration = siteStats.averageSessionDuration;
      
    
      if (duration > siteMaxDuration * this.config.longVisitMultiplier) {
        alerts.push(this._alert(
          'long_visit_site_record', 
          `Sesiune record pe ${domain}: ${(duration / 60000).toFixed(1)}min (max anterior: ${(siteMaxDuration / 60000).toFixed(1)}min)`,
          domain
        ));
      }
    
      else if (duration > siteAvgDuration * (this.config.longVisitMultiplier + 1)) {
        alerts.push(this._alert(
          'long_visit_site_avg', 
          `Sesiune lungă pe ${domain}: ${(duration / 60000).toFixed(1)}min (media: ${(siteAvgDuration / 60000).toFixed(1)}min)`,
          domain
        ));
      }
    } else {
      
      const globalAvg = profile.averageSessionTime || (  60 * 1000);
      if (duration > globalAvg * this.config.longVisitMultiplier) {
        alerts.push(this._alert(
          'long_visit_global', 
          `Sesiune lungă pe ${domain}: ${(duration / 60000).toFixed(1)}min`,
          domain
        ));
      }
    }

    
    const hour = new Date().getHours();
    const isUnusualHour = !profile.typicalHours || !profile.typicalHours[hour];
    if (isUnusualHour && duration > 30 * 60 * 1000) { 
      alerts.push(this._alert('unusual_hour', `Activitate neobișnuită la ora ${hour}`, domain));
    }

    
    const siteVisits = profile.frequentSites?.[domain] || 0;
    if (siteVisits <= 1 && duration > 60 * 1000) {
      alerts.push(this._alert('unusual_domain', `Site rar accesat: ${domain}`, domain));
    }

    
    const today = new Date().toDateString();
    const timeToday = data.sessions
      .filter(s => s.category === category && new Date(s.startTime).toDateString() === today)
      .reduce((sum, s) => sum + s.duration, 0);
    if (this.riskCategories.includes(category) && timeToday > this.config.riskTimeThresholdHours * 3600000) {
      alerts.push(this._alert('risky_time', `Prea mult timp pe ${category}`, domain));
    }

    if (alerts.length) {
      this._log('Adaptive alerts', alerts);
      this.alerts.push(...alerts);
      
      for (const alert of alerts) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../icons/logo_16x16.png',
          title: '⚠️ Alertă comportamentală',
          message: alert.message
        });
      }
      this.alertedSessions.add(sessionKey);
      

      await this.sendAlertsToBackend(alerts);
    }
  }

  _alert(type, message, domain) {
    return {
      type,
      message,
      domain,
      timestamp: Date.now(),
      severity: this.calculateAlertSeverity(type),
      category: 'behavior'
    };
  }

  calculateAlertSeverity(type) {
    const severityMap = {
      'long_visit_site_record': 'high',   
      'long_visit_site_avg': 'medium',    
      'long_visit_global': 'medium',       
      'risky_time': 'high',
      'unusual_hour': 'medium',
      'unusual_domain': 'low'
    };
    return severityMap[type] || 'low';
  }

  
  async getSiteStats(domain = null) {
    const result = await chrome.storage.local.get('behaviorData');
    let data = result.behaviorData;
    
    if (!data) return domain ? null : {};
    
   
    data = this._ensureDataStructure(data);
    
    if (domain) {
      return data.siteStats[domain] || null;
    }
    
    return data.siteStats;
  }

  
  async debugSiteStats() {
    const siteStats = await this.getSiteStats();
    console.log('=== SITE STATISTICS DEBUG ===');
    
    if (Object.keys(siteStats).length === 0) {
      console.log('No site statistics found');
      return;
    }
    
    Object.entries(siteStats).forEach(([domain, stats]) => {
      console.log(`${domain}:`, {
        maxSession: (stats.maxSessionDuration / 60000).toFixed(1) + 'min',
        avgSession: (stats.averageSessionDuration / 60000).toFixed(1) + 'min',
        totalSessions: stats.totalSessions,
        lastUpdated: new Date(stats.lastUpdated).toLocaleString()
      });
    });
    console.log('===========================');
  }

  
  addDLPIntegration(dlpEngine) {
    this.dlpEngine = dlpEngine;
    this._log('DLP Engine integrated with behavior tracker');
  }

  addDLPAlert(dlpAlert) {
    const behaviorAlert = {
      type: 'dlp_detection',
      message: `DLP Alert: ${dlpAlert.detections?.length || 0} sensitive data detected`,
      domain: this.currentSession?.domain || 'unknown',
      timestamp: Date.now(),
      severity: dlpAlert.severity || 'medium',
      category: 'dlp',
      metadata: dlpAlert
    };
    
    this.alerts.push(behaviorAlert);
    this._log('DLP alert added to behavior tracker', behaviorAlert);
  }

  async getBehaviorStats() {
    const result = await chrome.storage.local.get('behaviorData');
    let data = result.behaviorData || { sessions: [], userProfile: {}, siteStats: {} };
    
    
    data = this._ensureDataStructure(data);
    
    const now = Date.now();
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);
    const recentSessions = data.sessions.filter(s => s.startTime > last7Days);
    

    const stats = {
      totalSessions: data.sessions.length,
      recentSessions: recentSessions.length,
      userProfile: data.userProfile,
      recentActivity: this.buildRecentActivity(recentSessions),
      categoryBreakdown: this.buildCategoryBreakdown(recentSessions),
      siteStats: data.siteStats, 
      totalAlerts: this.alerts.length,
      alertsByType: this.groupAlertsByType()
    };
    
    return stats;
  }

  buildRecentActivity(sessions) {
    const activity = {};
    sessions.forEach(session => {
      const date = new Date(session.startTime).toDateString();
      if (!activity[date]) {
        activity[date] = {
          sessionCount: 0,
          totalTime: 0,
          uniqueSites: new Set()
        };
      }
      
      activity[date].sessionCount++;
      activity[date].totalTime += session.duration || 0;
      activity[date].uniqueSites.add(session.domain);
    });
    
    
    Object.keys(activity).forEach(date => {
      activity[date].uniqueSites = activity[date].uniqueSites.size;
    });
    
    return activity;
  }

  buildCategoryBreakdown(sessions) {
    const categories = {};
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    sessions.forEach(session => {
      const cat = session.category || 'other';
      if (!categories[cat]) {
        categories[cat] = {
          sessionCount: 0,
          totalTime: 0,
          uniqueSites: new Set()
        };
      }
      
      categories[cat].sessionCount++;
      categories[cat].totalTime += session.duration || 0;
      categories[cat].uniqueSites.add(session.domain);
    });
    
  
    Object.keys(categories).forEach(cat => {
      categories[cat].percentage = totalTime > 0 
        ? ((categories[cat].totalTime / totalTime) * 100).toFixed(1)
        : 0;
      categories[cat].uniqueSites = Array.from(categories[cat].uniqueSites);
    });
    
    return categories;
  }

  groupAlertsByType() {
    const grouped = {};
    this.alerts.forEach(alert => {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    });
    return grouped;
  }

  getStatus() {
    return {
      isActive: this.isActive,
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      alertCount: this.alerts.length,
      userId: this.userId?.substring(0, 10) + '***'
    };
  }

  updateActivity() {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now();
    }
  }

  async sendAlertsToBackend(alerts = null) {
    if (!this.userId || !this.token) return;
    
    const alertsToSend = alerts || this.alerts.slice();
    if (alertsToSend.length === 0) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/behavior/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          userId: this.userId,
          alerts: alertsToSend
        })
      });
      
      if (response.ok) {
        this._log(`✅ ${alertsToSend.length} behavior alerts sent to backend`);
        if (!alerts) {
          this.alerts = []; 
        }
      }
    } catch (error) {
      this._error('Error sending behavior alerts:', error);
    }
  }

  async triggerTestAlert() {
    const testAlert = this._alert(
      'test_alert',
      'Test alert triggered manually',
      this.currentSession?.domain || 'test.com'
    );
    
    this.alerts.push(testAlert);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/logo_16x16.png',
      title: '🧪 Test Alert',
      message: testAlert.message
    });
    
    await this.sendAlertsToBackend([testAlert]);
    return true;
  }

  // Cleanup
  destroy() {
    this.isActive = false;
    this.isTracking = false;
    
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    
   
    if (this.currentSession) {
      this.endSession();
    }
    
    this._log('BehaviorTracker destroyed');
  }
}

const behaviorTracker = new BehaviorTracker();
self.behaviorTracker = behaviorTracker;