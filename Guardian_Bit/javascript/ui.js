import { isJwtExpired, updateAdBlockBadge, updateAdsBlockedStats, showNotification } from "./popup.js";


export function initUI() {
  const statusElement = document.getElementById("status");
  const currentSiteElement = document.getElementById("current-site");
  const riskScoreElement = document.getElementById("risk-score");
  const blockedCountElement = document.getElementById("blocked-count");
  const protectionToggle = document.getElementById("real-time-protection");
  const reportButton = document.getElementById("report-site-button");
  const reportWarning = document.getElementById("report-warning");
  const adBlockToggle = document.getElementById('real-time-protection-ads');


  if (!statusElement) console.warn("⚠️ Elementul #status lipsește din DOM.");
  if (!currentSiteElement) console.warn("⚠️ Elementul #current-site lipsește din DOM.");
  if (!protectionToggle) console.warn("⚠️ Elementul #real-time-protection lipsește din DOM.");
  if (!riskScoreElement) console.warn("⚠️ Elementul #risk-score lipsește din DOM.");
  if (!blockedCountElement) console.warn("⚠️ Elementul #blocked-count lipsește din DOM.");
  if (!adBlockToggle) console.warn("⚠️ Elementul #real-time-protection-ads lipsește din DOM.");
  updateStatistics();
  if (
    !statusElement ||
    !currentSiteElement ||
    !protectionToggle ||
    !riskScoreElement ||
    !blockedCountElement
  ) {
    console.error("❌ Eroare: Elemente lipsă din UI.");
    return;
  }

  chrome.storage.local.get("user", function (data) {
    if (data.user) {
      reportButton.style.display = "block";
      reportWarning.style.display = "none";
    } else {
      reportButton.style.display = "none";
      reportWarning.style.display = "block";
    }
  });

  chrome.storage.local.get(['adBlockEnabled', 'blockedAdsCount'], function(result) {
    if (adBlockToggle) {
      adBlockToggle.checked = result.adBlockEnabled === true;
      
    
      updateAdBlockBadge(result.adBlockEnabled === true);
      
      
      const adsBlockedCount = result.blockedAdsCount || 0;
      
      
      createAdsBlockedCard();
      updateAdsBlockedStats(adsBlockedCount);
      
     
      adBlockToggle.addEventListener('change', function() {
        const isEnabled = adBlockToggle.checked;
        
       
        chrome.storage.local.set({ adBlockEnabled: isEnabled }, function() {
          console.log('Setarea de blocare reclame a fost actualizată: ' + isEnabled);
          
          
          updateAdBlockBadge(isEnabled);
          
          
          const statusMessage = isEnabled ? 
              "Protecția împotriva reclamelor a fost activată!" : 
              "Protecția împotriva reclamelor a fost dezactivată.";
          
          showNotification("Setare actualizată", statusMessage);
        });
      });
    }
  });

  reportButton?.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = tabs[0].url;

      chrome.storage.local.get(["user", "token"], function (data) {
        if (data.user && data.token) {
          if (isJwtExpired(data.token)) {
            alert("⏰ Tokenul a expirat. Te rugăm să te autentifici din nou.");
            chrome.storage.local.remove(["user", "token"]);
            return;
          }

          fetch("http://localhost:8080/api/report", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              url: url,
              email: data.user 
            }),
          })
            .then((res) => res.text())
            .then((text) => {
              alert(`✅ Raportat cu succes: ${text}`);
            
              
              const currentCount = parseInt(sessionStorage.getItem("reportCount") || "0", 10);
              sessionStorage.setItem("reportCount", currentCount + 1);
              updateStatistics();
              loadReportHistory();
            })
            
            .catch((err) => {
              console.error("❌ Eroare la raportare:", err);
              alert("❌ Eroare la raportare.");
            });
        } else {
          alert("⚠️ Trebuie să fii autentificat.");
        }
      });
    });
  });

  chrome.storage.local.get("lastScan", function (data) {
    if (!data.lastScan) {
      statusElement.innerText = "⚠️ Nicio verificare!";
      statusElement.style.color = "orange";
      return;
    }

    chrome.storage.local.get('scannedFiles', function(data) {
      const files = data.scannedFiles || [];
      displayScannedFiles(files);
    });

    chrome.storage.local.get("blockedSites", function (data) {
      if (blockedCountElement && data.blockedSites !== undefined) {
        blockedCountElement.innerText = data.blockedSites;
      }
    });

    updateUI(data.lastScan);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateUI" && message.data) {
      updateUI(message.data);
    }

    if (message.action === "refreshBehaviorAlerts") {
      if (typeof self.loadBehaviorAlerts === 'function') {
        self.loadBehaviorAlerts();
      } else {
        chrome.runtime.sendMessage({ action: "loadBehaviorScripts" }, () => {
          if (typeof self.loadBehaviorAlerts === 'function') {
            self.loadBehaviorAlerts();
          }
        });
      }
    }

    if (message.action === "updateBlockedCount") {
      blockedCountElement.innerText = message.data;
    }

    if (message.action === "malicious_script_detected") {
      alert("🚨 Script suspect detectat în pagina curentă!");
    }

    if (message.action === "updateScannedFiles") {
      displayScannedFiles(message.data);
    }

     if (message.action === "updateBehaviorDashboard") {
      const behaviorTab = document.getElementById('behavior-tab');
      if (behaviorTab && behaviorTab.classList.contains('active')) {
       
        if (typeof self.renderBehaviorDashboard === 'function') {
          self.renderBehaviorDashboard();
        }
      }
    }


     if (message.action === "updateDLPDashboard") {
      const dlpTab = document.getElementById('dlp-tab');
      if (dlpTab && dlpTab.classList.contains('active')) {
      
        if (typeof self.renderDLPDashboard === 'function') {
          self.renderDLPDashboard();
        }
      }
    }
  });

 
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add("active");

  
      if (tab.dataset.tab === "files-tab") {
        chrome.storage.local.get('scannedFiles', function(data) {
          const files = data.scannedFiles || [];
          displayScannedFiles(files);
        });
      }
      if (tab.dataset.tab === 'behavior-tab') {
        const behaviorTabContent = document.getElementById('behavior-tab');
        
        // Afișează loading
        behaviorTabContent.innerHTML = '<div class="loading">Se încarcă...</div>';
        
       
        chrome.storage.local.get(['user', 'token'], (data) => {
          if (!data.user || !data.token) {
            behaviorTabContent.innerHTML = `
              <div class="behavior-auth-warning">
                <h3>🔒 Autentificare necesară</h3>
                <p>Pentru a vedea analiza comportamentului, trebuie să te autentifici.</p>
                <p>Mergi la tab-ul "Contul meu" pentru a te conecta.</p>
              </div>
            `;
            return;
          }

         
          loadBehaviorDashboard();
        });
      }

      
      if (tab.dataset.tab === "statistics-tab") {
        chrome.storage.local.get(["siteHistory"], function (data) {
          const sites = data.siteHistory || [];
          const total = sites.length;
          const maliciousCount = sites.filter(s => s.finalDecision === "MALICIOUS").length;
          const percentage = total > 0 ? Math.round((maliciousCount / total) * 100) : 0;

          animateProgressBar(percentage);
          document.getElementById("progress-summary").textContent =
            `${maliciousCount} site-uri periculoase din ${total} (${percentage}%)`;

        });

        updateStatistics();
        displayTopMaliciousSites();

      }

      if (tab.dataset.tab === "report-tab") {
        loadReportHistory();
      }

      
      if (tab.dataset.tab === "dlp-tab") {
        loadDLPDashboard();
      }

    

      if (tab.dataset.tab !== "scan-file-tab") {
        resetScanTabUI();
      }

      
    });
  });
}

function loadDLPDashboard() {
  const dlpTab = document.getElementById('dlp-tab');
  if (!dlpTab) return;
  
 
  dlpTab.innerHTML = '<div class="loading">⏳ Se încarcă DLP dashboard...</div>';
  
  
  chrome.storage.local.get(['user', 'token'], (data) => {
    if (!data.user || !data.token) {
      dlpTab.innerHTML = `
         <div class="behavior-auth-warning">
                <h3>🔒 Autentificare necesară</h3>
                <p>Pentru a vedea analiza datelor pe care le introduceti, trebuie să te autentifici.</p>
                <p>Mergi la tab-ul "Contul meu" pentru a te conecta.</p>
              </div>
      `;
      return;
    }


    loadDLPDashboardScript();
  });
}

function loadDLPDashboardScript() {

  if (self.renderDLPDashboard && typeof self.renderDLPDashboard === 'function') {
    console.log('✅ DLP dashboard already loaded, rendering...');
    self.renderDLPDashboard();
    return;
  }


  const script = document.createElement('script');
  const dlpTab = document.getElementById('dlp-tab');
  
  script.src = '../javascript/dlp-dashboard.js';
  script.type = 'text/javascript';
  
  script.onload = () => {
    console.log('✅ DLP dashboard script loaded successfully');
    
   
    setTimeout(() => {
      if (self.renderDLPDashboard && typeof self.renderDLPDashboard === 'function') {
        self.renderDLPDashboard();
      } else {
        console.error('❌ renderDLPDashboard function not available after loading');
        dlpTab.innerHTML = `
          <div class="dlp-error">
            <h3>❌ Eroare de inițializare</h3>
            <p>DLP dashboard nu s-a putut inițializa.</p>
            <button onclick="loadDLPDashboard()">🔄 Reîncarcă</button>
          </div>
        `;
      }
    }, 100);
  };
  
  script.onerror = (error) => {
    console.error('❌ Failed to load DLP dashboard script:', error);
    dlpTab.innerHTML = `
      <div class="dlp-error">
        <h3>❌ Eroare de încărcare</h3>
        <p>Nu s-a putut încărca DLP dashboard.</p>
        <button onclick="loadDLPDashboard()">🔄 Încearcă din nou</button>
      </div>
    `;
  };
  
  document.head.appendChild(script);
}

function createAdsBlockedCard() {
  const statsCards = document.querySelector('.statistics-cards');
  if (!statsCards) return;
  
  
  let adsBlockedCard = document.getElementById('ads-blocked-card');
  
  if (!adsBlockedCard) {

    adsBlockedCard = document.createElement('div');
    adsBlockedCard.id = 'ads-blocked-card';
    adsBlockedCard.className = 'stats-card';
    
    const cardTitle = document.createElement('h4');
    cardTitle.textContent = 'Reclame blocate';
    
    const countSpan = document.createElement('span');
    countSpan.id = 'ads-blocked-count';
    countSpan.textContent = '0';
    
    adsBlockedCard.appendChild(cardTitle);
    adsBlockedCard.appendChild(countSpan);
    
   
    statsCards.appendChild(adsBlockedCard);
  }
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'adsBlocked') {
    
    chrome.storage.local.get(['blockedAdsCount'], function(result) {
      const currentCount = result.blockedAdsCount || 0;
      const newCount = currentCount + message.count;
      
      chrome.storage.local.set({ blockedAdsCount: newCount }, function() {
      
        if (document.getElementById('ads-blocked-count')) {
          updateAdsBlockedStats(newCount);
        }
      });
    });
  }
});

function updateUI(scan) {
  const statusElement = document.getElementById("status");
  const currentSiteElement = document.getElementById("current-site");
  const riskScoreElement = document.getElementById("risk-score");
  const blockedCountElement = document.getElementById("blocked-count");
  const currentSiteReport = document.getElementById("current-site-report");
  
  
  if (currentSiteElement) {
    currentSiteElement.innerText = scan.url;
  }
  if (currentSiteReport) {
    currentSiteReport.innerText = scan.url;
  }

  if (riskScoreElement) {
    riskScoreElement.innerText = `${scan.riskScore}/100`;
  }

  if (statusElement) {
    const statusText = scan.finalDecision === "MALICIOUS" ? "🚨 Periculos!" : "✅ Sigur";
    const statusColor = scan.finalDecision === "MALICIOUS" ? "red" : "green";
    statusElement.innerText = statusText;
    statusElement.style.color = statusColor;
  }


  chrome.runtime.sendMessage({ action: "get_blocked_count" }, (response) => {
    if (response?.blockedCount !== undefined && blockedCountElement) {
      blockedCountElement.innerText = response.blockedCount;
    }
  });

   const activeTab = document.querySelector(".tab.active");
  if (activeTab && activeTab.dataset.tab !== "scan-file-tab") {
    resetScanTabUI();
  }
}


export function displayScannedFiles(files) {
  const fileList = document.getElementById('scanList');
  const emptyState = document.querySelector('.empty-state');
  
  if (!fileList) {
    console.error("❌ Elementul scanList lipsește din HTML!");
    return;
  }
  
  fileList.innerHTML = ''; 

  if (!files || files.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  files.forEach(file => {
    const li = document.createElement('li');
    li.className = 'file-item';
    
    
    if (file.isMalicious || file.riskScore > 70) { 
      li.classList.add('danger');
    }

    li.innerHTML = `
      <span class="file-name tooltip-wrapper">
      ${truncateFilename(file.filename || 'Necunoscut')}
      <div class="tooltip">
        ${generateTooltipHTML(file)}
      </div>
    </span>

      <span class="file-status">${file.isMalicious ? '⚠️ Periculos' : '✓ Sigur'}</span>
      ${file.yaraRule ? `<div class="file-yara">Regulă YARA: ${file.yaraRule}</div>` : ''}
    `;
    
    fileList.appendChild(li);
  });
}

export function generateTooltipHTML(file) {
  const date = new Date(file.scanDate).toLocaleString("ro-RO");
  const sizeKB = file.fileSize ? (file.fileSize / 1024).toFixed(1) : "N/A";
  const yara = file.yaraResult === true ? "Malicious" : file.yaraResult === false ? "Safe" : "Unknown";
  const hybrid = file.isHybrid ? "Da" : "Nu";
  

  return `
<b>🗂️ Nume:</b> ${truncateFilename(file.filename, 20)}
<b>📅 Scanat:</b> ${date}
<b>📦 Dimensiune:</b> ${sizeKB} KB
<b>🛡️ YARA:</b> ${truncateText(yara, 15)}
<b>🦠 Hybrid:</b> ${hybrid}
<b>⚠️ Status:</b> ${file.isMalicious ? "Periculos" : "Sigur"}
  `;
}


function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function truncateFilename(name, maxLength = 25) {
  if (name.length <= maxLength) return name;

  const extIndex = name.lastIndexOf(".");
  const ext = extIndex !== -1 ? name.slice(extIndex) : "";
  const base = name.slice(0, maxLength - ext.length - 3);

  return `${base}...${ext}`;
}

function animateProgressBar(percentage) {
  const progressBar = document.getElementById("site-progress-bar");
  const progressElement = progressBar?.querySelector("progress");

  if (progressBar) {
    
    const oldText = document.getElementById("progress-text");
    if (oldText) oldText.remove();

    
    const textSpan = document.createElement("span");
    textSpan.id = "progress-text";
    textSpan.textContent = "0%";
    progressBar.prepend(textSpan);

    let current = 0;
    progressBar.style.setProperty('--progress-value', 0);

    const interval = setInterval(() => {
      if (current >= percentage) {
        clearInterval(interval);
      } else {
        current++;
        progressBar.style.setProperty('--progress-value', current);
        textSpan.textContent = `${current}%`;
        if (progressElement) progressElement.value = current;
      }
    }, 15);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tooltip-wrapper').forEach(wrapper => {
    wrapper.addEventListener('mouseenter', function() {
      const tooltip = this.querySelector('.tooltip');
      if (!tooltip) return;

    
      tooltip.classList.remove('top', 'bottom');

    
      const wrapperRect = this.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const popupHeight = document.querySelector('.container').clientHeight;

      
      const spaceAbove = wrapperRect.top;
      const spaceBelow = popupHeight - wrapperRect.bottom;

      
      if (spaceBelow < tooltipRect.height && spaceAbove > tooltipRect.height) {
        tooltip.classList.add('top'); 
      } else {
        tooltip.classList.add('bottom'); 
      }

   
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    });

    wrapper.addEventListener('mouseleave', function() {
      const tooltip = this.querySelector('.tooltip');
      if (tooltip) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      }
    });
  });
});

export function updateStatistics() {
  // 🧠 1. Site-uri malicioase (hit-uri Redis)
  fetch("http://localhost:8080/api/stats/malicious-urls")
    .then(res => res.json())
    .then(data => {
      const blockedCountElement = document.getElementById("blocked-count");
      if (blockedCountElement && data.maliciousCount !== undefined) {
        blockedCountElement.innerText = data.maliciousCount;
      }
    })
    .catch(err => console.error("❌ Eroare la preluarea site-urilor malicioase:", err));

  
  chrome.storage.local.get("scannedFiles", function (data) {
    const count = data.scannedFiles?.length || 0;
    const fileScannedCount = document.getElementById("file-scanned-count");
    if (fileScannedCount) fileScannedCount.innerText = count;
  });


  const reportCount = parseInt(sessionStorage.getItem("reportCount") || "0", 10);
  const reportedCount = document.getElementById("reported-count");
  if (reportedCount) reportedCount.innerText = reportCount;
}

function displayTopMaliciousSites() {
  fetch("http://localhost:8080/api/stats/top-malicious")
    .then(res => res.json())
    .then(domains => {
      const container = document.getElementById("malicious-sites-list");
      if (!container) return;

      container.innerHTML = "";
      domains.forEach(domain => {
        const li = document.createElement("li");
        li.textContent = domain;
        
        console.log("Domeniu identificat: "+domain);
        container.appendChild(li);
      });
    })
    .catch(err => console.error("❌ Eroare la preluarea top site-uri malicioase:", err));
}

function loadReportHistory() {
  chrome.storage.local.get("user", function (data) {
    const reportButton = document.getElementById("report-site-button");
    const reportWarning = document.getElementById("report-warning");

    if (data.user) {
      if (reportButton) reportButton.style.display = "block";
      if (reportWarning) reportWarning.style.display = "none";
    } else {
      if (reportButton) reportButton.style.display = "none";
      if (reportWarning) reportWarning.style.display = "block";
      return;
    }

    fetch(`http://localhost:8080/api/report/history?email=${data.user}`)
      .then(res => res.json())
      .then(reports => {
        const container = document.getElementById("report-history-list");
        const historySection = document.querySelector(".report-history");

        if (!container || !historySection) return;

        container.innerHTML = "";

        const uniqueReports = [];
        const seen = new Set();

        reports.forEach(report => {
          if (!seen.has(report.url)) {
            seen.add(report.url);
            uniqueReports.push(report);
          }
        });

        if (uniqueReports.length === 0) {
          historySection.classList.add("hidden");
        } else {
          historySection.classList.remove("hidden");

          uniqueReports.forEach(report => {
            const li = document.createElement("li");
            const date = new Date(report.timestamp).toLocaleString("ro-RO");
            li.textContent = `${report.url} — ${date}`;
            container.appendChild(li);
          });
        }
      })
      .catch(err => console.error("❌ Eroare la preluarea istoricului raportărilor:", err));
  });
}

function resetScanTabUI() {
  const fileInput = document.getElementById("fileInput");
  const uploadStatus = document.getElementById("uploadStatus");
  const scanProgress = document.getElementById("scanProgress");
  const scanResult = document.getElementById("scanResult");

  if (fileInput) fileInput.value = "";
  if (uploadStatus) uploadStatus.textContent = "";
  if (scanProgress) scanProgress.value = 0;
  if (scanResult) scanResult.innerHTML = "";
}


function loadBehaviorDashboard() {
  const behaviorTab = document.getElementById('behavior-tab');
  if (!behaviorTab) return;
  

  behaviorTab.innerHTML = '<div class="loading">⏳ Se încarcă behavior dashboard...</div>';
  
 
  chrome.storage.local.get(['user', 'token'], (data) => {
    if (!data.user || !data.token) {
      behaviorTab.innerHTML = `
        <div class="behavior-auth-warning">
          <h3>🔒 Autentificare necesară</h3>
          <p>Pentru a vedea analiza comportamentului, trebuie să te autentifici.</p>
          <p>Mergi la tab-ul "Contul meu" pentru a te conecta.</p>
        </div>
      `;
      return;
    }

    
    loadBehaviorDashboardScript();
  });
}

function loadBehaviorDashboardScript() {
  // Check dacă script-ul este deja încărcat
  if (self.renderBehaviorDashboard && typeof self.renderBehaviorDashboard === 'function') {
    console.log('✅ Behavior dashboard already loaded, rendering...');
    self.renderBehaviorDashboard();
    return;
  }


  const script = document.createElement('script');
  const behaviorTab = document.getElementById('behavior-tab');
  
  script.src = '../javascript/behavior-dashboard.js';
  script.type = 'text/javascript';
  
  script.onload = () => {
    console.log('✅ Behavior dashboard script loaded successfully');
    
  
    setTimeout(() => {
      if (self.renderBehaviorDashboard && typeof self.renderBehaviorDashboard === 'function') {
        self.renderBehaviorDashboard();
      } else {
        console.error('❌ renderBehaviorDashboard function not available after loading');
        behaviorTab.innerHTML = `
          <div class="behavior-error">
            <h3>❌ Eroare de inițializare</h3>
            <p>Behavior dashboard nu s-a putut inițializa.</p>
            <button onclick="loadBehaviorDashboard()">🔄 Reîncarcă</button>
          </div>
        `;
      }
    }, 100);
  };
  
  script.onerror = (error) => {
    console.error('❌ Failed to load behavior dashboard script:', error);
    behaviorTab.innerHTML = `
      <div class="behavior-error">
        <h3>❌ Eroare de încărcare</h3>
        <p>Nu s-a putut încărca behavior dashboard.</p>
        <button onclick="loadBehaviorDashboard()">🔄 Încearcă din nou</button>
      </div>
    `;
  };
  
  document.head.appendChild(script);
}

self.loadDLPDashboard = loadDLPDashboard;
self.loadBehaviorDashboard = loadBehaviorDashboard;

