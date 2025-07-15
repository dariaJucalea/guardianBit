// behavior-dashboard.js - Dashboard comportamental cu design stilizat

self.renderBehaviorDashboard = function () {
  const container = document.getElementById("behavior-tab");
  if (!container) return;

  container.innerHTML = '<div class="loading">📊 Se încarcă analiza comportamentală...</div>';

  chrome.storage.local.get(["user", "token"], (authData) => {
    if (!authData.user || !authData.token) {
      container.innerHTML = `
        <div class="behavior-auth-warning">
          <h3>🔒 Autentificare necesară</h3>
          <p>Pentru a accesa analiza comportamentală, conectează-te în contul tău.</p>
        </div>
      `;
      return;
    }

    chrome.runtime.sendMessage({ action: "getBehaviorStats" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        container.innerHTML = '<div class="error">❌ Nu s-au putut încărca datele comportamentale</div>';
        return;
      }

      renderBehaviorDashboardContent(container, response.data);
    });
  });
};

function renderBehaviorDashboardContent(container, data) {
  if (!data) {
    container.innerHTML = '<div class="no-activity">Nu sunt date suficiente pentru afișare.</div>';
    return;
  }

  const totalCategories = Object.keys(data.userProfile?.preferredCategories || {}).length;

  container.innerHTML = `
    <div class="behavior-dashboard">
      <div class="behavior-header">
        <h3>🧠 Analiză Comportamentală</h3>
        <div class="behavior-status">🔍 ${data.totalSessions} sesiuni analizate</div>
      </div>

      <div class="behavior-main-cards">
        <div class="behavior-card">
          <div class="card-header">🕒 Ore active</div>
          <div class="card-value">${Object.keys(data.userProfile?.typicalHours || {}).length}</div>
        </div>
        <div class="behavior-card">
          <div class="card-header">🌐 Site-uri frecvente</div>
          <div class="card-value">${Object.keys(data.userProfile?.frequentSites || {}).length}</div>
        </div>
        <div class="behavior-card">
          <div class="card-header">📂 Categorii</div>
          <div class="card-value">${totalCategories}</div>
        </div>
        <div class="behavior-card">
          <div class="card-header">⏱️ Timp mediu/sesiune</div>
          <div class="card-value">${(data.userProfile?.averageSessionTime / 60000).toFixed(1)} min</div>
        </div>
      </div>

      <div class="behavior-section">
        <h4>📈 Activitate recentă</h4>
        ${renderRecentActivity(data.recentActivity)}
      </div>

      <div class="behavior-section">
        <h4>📊 Categorii preferate</h4>
        ${renderCategoryBreakdown(data.categoryBreakdown)}
      </div>

      <div class="behavior-section">
        <h4>👤 Profil utilizator</h4>
        ${renderUserProfile(data.userProfile)}
      </div>
    </div>
  `;

  addBehaviorStyles();
}

function renderRecentActivity(recentActivity) {
  if (!recentActivity || Object.keys(recentActivity).length === 0) {
    return '<div class="no-activity">Nu există activitate recentă.</div>';
  }

  return `
    <div class="recent-activity">
      ${Object.entries(recentActivity).map(([date, act]) => {
        const hours = (act.totalTime / (1000 * 60 * 60)).toFixed(1);
        return `
          <div class="activity-entry">
            <strong>${new Date(date).toLocaleDateString()}</strong>
            <span>${hours} ore</span>
            <span>${act.uniqueSites} site-uri</span>
            <span>${act.sessionCount} sesiuni</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderCategoryBreakdown(breakdown) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return '<div class="no-activity">Nu există date despre categorii.</div>';
  }

  return `
    <div class="category-breakdown">
      ${Object.entries(breakdown).map(([cat, data]) => {
        const pct = data.percentage || 0;
        const hours = (data.totalTime / 3600000).toFixed(1);
        return `
          <div class="category-entry">
            <span>${getCategoryIcon(cat)} ${cat}</span>
            <span>${hours}h, ${data.sessionCount} sesiuni </span>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderUserProfile(profile) {
  if (!profile) return '';
  const topSite = Object.entries(profile.frequentSites || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  const peakHour = Object.entries(profile.typicalHours || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return `
    <div class="user-profile">
      <div class="profile-item">🔝 Site preferat: <strong>${topSite}</strong></div>
      <div class="profile-item">🕓 Oră de vârf: <strong>${peakHour}:00</strong></div>
    </div>
  `;
}

function getCategoryIcon(cat) {
  const icons = {
    social: "📱", work: "💼", entertainment: "🎬", gaming: "🎮", shopping: "🛒",
    news: "📰", education: "📚", finance: "💰", health: "🏥", adult: "🔞",
    gambling: "🎰", other: "🌐"
  };
  return icons[cat] || "🌐";
}

function addBehaviorStyles() {
  if (document.getElementById('behavior-dashboard-styles')) return;
  const style = document.createElement('style');
  style.id = 'behavior-dashboard-styles';
  style.textContent = `
    .behavior-dashboard {
      padding: 16px;
      background: linear-gradient(135deg, #e0ecf8, #fdfdfd);
      border-radius: 12px;
    }
    .behavior-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ccc;
      margin-bottom: 20px;
    }
    .behavior-header h3 {
      margin: 0;
      font-size: 1.5em;
      color: #2d3748;
    }
    .behavior-status {
      font-weight: bold;
      color: #4a5568;
    }
    .behavior-main-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .behavior-card {
      background: white;
      border-left: 4px solid #2b6cb0;
      padding: 16px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      transition: transform 0.2s;
    }
    .behavior-card:hover {
      transform: translateY(-2px);
    }
    .card-header {
      font-size: 0.9em;
      color: #718096;
    }
    .card-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #2d3748;
    }
    .behavior-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .behavior-section h4 {
      margin: 0 0 12px;
      color: #2c5282;
    }
    .activity-entry, .category-entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #edf2f7;
    }
  .behavior-dashboard .progress-container {
      background: #e2e8f0;
      height: 6px;
      width: 100%;
      border-radius: 4px;
      margin-top: 4px;
    }
    .behavior-dashboard .progress-bar {
      height: 100%;
      background: #4299e1;
      border-radius: 4px;
    }
    .user-profile .profile-item {
      margin-bottom: 8px;
      font-size: 0.95em;
    }
    .loading, .no-activity, .error {
      text-align: center;
      padding: 30px;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
}


setInterval(() => {
  const tab = document.querySelector('.tab.active');
  if (tab?.dataset.tab === 'behavior-tab') {
    self.renderBehaviorDashboard();
  }
}, 2 * 60 * 1000);
