
self.renderDLPDashboard = function () {
  const dlpTab = document.getElementById("dlp-tab");
  if (!dlpTab) return;


  dlpTab.innerHTML = '<div class="loading">📊 Se încarcă statisticile DLP...</div>';


  chrome.runtime.sendMessage({ action: "getDLPStats" }, (stats) => {
    if (!stats) {
      dlpTab.innerHTML = '<div class="error">❌ Nu s-au putut încărca statisticile DLP</div>';
      return;
    }

  
    chrome.storage.local.get(['dlpStats'], (storage) => {
      const allStats = storage.dlpStats || [];
      const detailedStats = processDetailedStats(allStats);
      
      renderDLPDashboardContent(dlpTab, stats, detailedStats);
    });
  });
};

function processDetailedStats(allStats) {
  const typeLabels = {
    cnp: "CNP-uri",
    phone: "Numere telefon",
    email: "Adrese email",
    iban: "IBAN-uri",
    card: "Carduri bancare",
    ci: "Serii CI",
    passport: "Pașapoarte"
  };

  const typeIcons = {
    cnp: "🆔",
    phone: "📞",
    email: "📧",
    iban: "🏦",
    card: "💳",
    ci: "📄",
    passport: "🛂"
  };

  const typeCounts = {};
  const last7Days = {};
  const todayStats = {};
  
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const todayStart = new Date().setHours(0, 0, 0, 0);

 
  allStats.forEach(entry => {
    if (entry.found && entry.timestamp) {
      Object.entries(entry.found).forEach(([type, items]) => {
        const count = items.length;
        
       
        typeCounts[type] = (typeCounts[type] || 0) + count;
        
       
        if (entry.timestamp >= oneWeekAgo) {
          last7Days[type] = (last7Days[type] || 0) + count;
        }
        
        
        if (entry.timestamp >= todayStart) {
          todayStats[type] = (todayStats[type] || 0) + count;
        }
      });
    }
  });

  return {
    typeLabels,
    typeIcons,
    typeCounts,
    last7Days,
    todayStats,
    totalDetections: Object.values(typeCounts).reduce((a, b) => a + b, 0),
    totalTypes: Object.keys(typeCounts).length
  };
}

function renderDLPDashboardContent(container, basicStats, detailedStats) {
  const totalDetections = detailedStats.totalDetections;
  const riskLevel = getRiskLevel(totalDetections);
  
  container.innerHTML = `
    <div class="dlp-dashboard">
      <!-- Header cu overview -->
      <div class="dlp-header">
        <h3>🛡️ DLP - Protecția Datelor Sensibile</h3>
        <div class="dlp-status ${riskLevel.class}">
          <span class="status-icon">${riskLevel.icon}</span>
          <span class="status-text">${riskLevel.text}</span>
        </div>
      </div>

      <!-- Carduri principale -->
      <div class="dlp-main-cards">
        <div class="dlp-card total-card">
          <div class="card-header">
            <span class="card-icon">📊</span>
            <span class="card-title">Total detectate</span>
          </div>
          <div class="card-value">${totalDetections}</div>
          <div class="card-subtitle">${detailedStats.totalTypes} tipuri diferite</div>
        </div>

        <div class="dlp-card month-card">
          <div class="card-header">
            <span class="card-icon">📅</span>
            <span class="card-title">Ultima lună</span>
          </div>
          <div class="card-value">${basicStats.lastMonth || 0}</div>
          <div class="card-subtitle">detecții recente</div>
        </div>

        <div class="dlp-card session-card">
          <div class="card-header">
            <span class="card-icon">💻</span>
            <span class="card-title">Sesiunea curentă</span>
          </div>
          <div class="card-value">${basicStats.thisSession || 0}</div>
          <div class="card-subtitle">în această sesiune</div>
        </div>

        <div class="dlp-card today-card">
          <div class="card-header">
            <span class="card-icon">🕐</span>
            <span class="card-title">Astăzi</span>
          </div>
          <div class="card-value">${Object.values(detailedStats.todayStats).reduce((a, b) => a + b, 0)}</div>
          <div class="card-subtitle">detecții astăzi</div>
        </div>
      </div>

      <!-- Breakdown pe tipuri -->
      <div class="dlp-breakdown-section">
        <h4>📋 Tipuri de date detectate</h4>
        <div class="dlp-types-grid">
          ${renderTypeBreakdown(detailedStats)}
        </div>
      </div>

      <!-- Progress indicators -->
      <div class="dlp-progress-section">
        <h4>📈 Activitate recentă (7 zile)</h4>
        <div class="dlp-progress-bars">
          ${renderProgressBars(detailedStats)}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="dlp-recommendations">
        <h4>💡 Recomandări</h4>
        <div class="recommendations-list">
          ${generateRecommendations(totalDetections, detailedStats)}
        </div>
      </div>
    </div>
  `;


  addDLPStyles();
}

function renderTypeBreakdown(stats) {
  if (Object.keys(stats.typeCounts).length === 0) {
    return '<div class="no-detections">Nu s-au detectat date sensibile încă.</div>';
  }

  return Object.entries(stats.typeCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => {
      const label = stats.typeLabels[type] || type;
      const icon = stats.typeIcons[type] || "📄";
      const recentCount = stats.last7Days[type] || 0;
      const todayCount = stats.todayStats[type] || 0;
      
      return `
        <div class="type-card">
          <div class="type-header">
            <span class="type-icon">${icon}</span>
            <span class="type-name">${label}</span>
          </div>
          <div class="type-stats">
            <div class="type-total">${count}</div>
            <div class="type-details">
              <span class="type-recent">7 zile: ${recentCount}</span>
              <span class="type-today">Azi: ${todayCount}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
}

function renderProgressBars(stats) {
  const maxCount = Math.max(...Object.values(stats.last7Days));
  
  if (maxCount === 0) {
    return '<div class="no-activity">Nu s-au detectat date în ultimele 7 zile.</div>';
  }

  return Object.entries(stats.last7Days)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => {
      const label = stats.typeLabels[type] || type;
      const icon = stats.typeIcons[type] || "📄";
      const percentage = Math.round((count / maxCount) * 100);
      
      return `
        <div class="progress-item">
          <div class="progress-label">
            <span>${icon} ${label}</span>
            <span class="progress-count">${count}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
}

function getRiskLevel(totalDetections) {
  if (totalDetections === 0) {
    return { class: 'safe', icon: '✅', text: 'Nicio detecție' };
  } else if (totalDetections < 10) {
    return { class: 'low', icon: '🟡', text: 'Risc scăzut' };
  } else if (totalDetections < 50) {
    return { class: 'medium', icon: '🟠', text: 'Risc mediu' };
  } else {
    return { class: 'high', icon: '🔴', text: 'Risc ridicat' };
  }
}

function generateRecommendations(totalDetections, stats) {
  const recommendations = [];

  if (totalDetections === 0) {
    recommendations.push({
      icon: '🎉',
      text: 'Excelent! Nu s-au detectat date sensibile. Continuați să fiți atenți la informațiile pe care le introduceți online.'
    });
  } else {
    if (stats.typeCounts.cnp > 0) {
      recommendations.push({
        icon: '⚠️',
        text: 'CNP-uri detectate: Evitați să introduceți CNP-ul pe site-uri nesigure.'
      });
    }
    
    if (stats.typeCounts.card > 0) {
      recommendations.push({
        icon: '💳',
        text: 'Date de card detectate: Folosiți doar site-uri HTTPS pentru plăți online.'
      });
    }
    
    if (stats.typeCounts.phone > 0 || stats.typeCounts.email > 0) {
      recommendations.push({
        icon: '📞',
        text: 'Date de contact detectate: Fiți atenți la site-urile unde vă lăsați datele de contact.'
      });
    }

    if (totalDetections > 10) {
      recommendations.push({
        icon: '🛡️',
        text: 'Activitate ridicată detectată: Considerați activarea unor protecții suplimentare pentru datele personale.'
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: '💡',
      text: 'Verificați periodic setările de confidențialitate ale browserului pentru protecție optimă.'
    });
  }

  return recommendations.map(rec => `
    <div class="recommendation-item">
      <span class="rec-icon">${rec.icon}</span>
      <span class="rec-text">${rec.text}</span>
    </div>
  `).join('');
}

function addDLPStyles() {

  if (document.getElementById('dlp-dashboard-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'dlp-dashboard-styles';
  styles.textContent = `
    .dlp-dashboard {
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      min-height: 400px;
    }

    .dlp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e1e5e9;
    }

    .dlp-header h3 {
      margin: 0;
      font-size: 1.5em;
      color: #2d3748;
    }

    .dlp-status {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9em;
    }

    .dlp-status.safe { background: #c6f6d5; color: #276749; }
    .dlp-status.low { background: #fef5e7; color: #744210; }
    .dlp-status.medium { background: #fed7d7; color: #742a2a; }
    .dlp-status.high { background: #fed7d7; color: #742a2a; }

    .dlp-main-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .dlp-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
      border-left: 4px solid #2A3E52;
    }

    .dlp-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .card-icon {
      font-size: 1.2em;
    }

    .card-title {
      font-size: 0.85em;
      color: #718096;
      font-weight: 500;
    }

    .card-value {
      font-size: 2em;
      font-weight: bold;
      color: #2d3748;
      line-height: 1;
    }

    .card-subtitle {
      font-size: 0.75em;
      color: #a0aec0;
      margin-top: 4px;
    }

    .dlp-breakdown-section,
    .dlp-progress-section,
    .dlp-recommendations {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .dlp-breakdown-section h4,
    .dlp-progress-section h4,
    .dlp-recommendations h4 {
      margin: 0 0 16px 0;
      color: #2d3748;
      font-size: 1.1em;
    }

    .dlp-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .type-card {
      background: #f7fafc;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e2e8f0;
    }

    .type-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .type-icon {
      font-size: 1.1em;
    }

    .type-name {
      font-weight: 500;
      color: #4a5568;
    }

    .type-total {
      font-size: 1.5em;
      font-weight: bold;
      color: #2d3748;
    }

    .type-details {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }

    .type-recent,
    .type-today {
      font-size: 0.8em;
      color: #718096;
    }

    .dlp-dashboard .progress-item {
      margin-bottom: 16px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 0.9em;
    }

    .progress-count {
      font-weight: bold;
      color: #4a5568;
    }

    .progress-bar-container {
      background: #e2e8f0;
      border-radius: 10px;
      height: 8px;
      overflow: hidden;
    }

    .dlp-dashboard .progress-bar {
      background: linear-gradient(90deg, #4299e1, #63b3ed);
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 3px solid #4299e1;
    }

    .rec-icon {
      font-size: 1.1em;
      margin-top: 2px;
    }

    .rec-text {
      flex: 1;
      font-size: 0.9em;
      color: #4a5568;
      line-height: 1.4;
    }

    .no-detections,
    .no-activity {
      text-align: center;
      color: #718096;
      font-style: italic;
      padding: 40px;
      background: #f7fafc;
      border-radius: 8px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #4a5568;
      font-size: 1.1em;
    }

    .error {
      text-align: center;
      color: #e53e3e;
      padding: 40px;
      background: #fed7d7;
      border-radius: 8px;
    }

    /* Animații */
    .dlp-card,
    .type-card,
    .recommendation-item {
      animation: fadeInUp 0.5s ease forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .progress-bar {
      animation: progressFill 1s ease forwards;
    }

    @keyframes progressFill {
      from { width: 0; }
    }
  `;

  document.head.appendChild(styles);
}