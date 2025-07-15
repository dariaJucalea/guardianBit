setInterval(() => {
    console.log("⏳ Service Worker activ...");
}, 60000);

const urlCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map();


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && 
      !tab.url.includes("chrome://") && 
      !tab.url.includes("chrome-extension://")) {
    

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./javascript/dlp-content.js']
    }).then(() => {
      console.log('✅ DLP content script injectat în:', tab.url);
    }).catch(error => {
      console.log("❌ DLP content script injection failed:", error.message);
    });

    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./javascript/dlp-content.js']
    }).catch(error => {
      console.log("DLP content script injection skipped:", error.message);
    });
  

if (!tab.url.includes("scan-page.html") && 
        !tab.url.includes("blocked.html") &&
        !tab.url.startsWith(chrome.runtime.getURL(""))) {
      
     
      verifyUrl(tab.url, tabId);

     
      scanTabScripts(tabId);

   
      if (self.behaviorTracker && self.behaviorTracker.isActive && changeInfo.url) {
        console.log("🔄 URL changed, updating behavior session:", changeInfo.url);
        self.behaviorTracker.startSession(tab.url, tabId);
      }
    }
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url && !tab.url.includes("chrome://") && !tab.url.includes("chrome-extension://")) {
      // Inject DLP în tab-ul activ
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['./javascript/dlp-content.js']
      }).then(() => {
        console.log('✅ DLP content script injectat în tab activ:', tab.url);
      }).catch(error => {
        console.log("❌ DLP injection failed in active tab:", error.message);
      });

      
    }
  });
});


function initializeBehaviorTracker() {
  console.log("🔄 Checking user authentication for behavior tracker...");
  
  checkUserAuthentication((isAuthenticated, userId, token) => {
    if (!isAuthenticated) {
      console.warn("🔒 Utilizatorul NU este autentificat – behavior tracking oprit.");
      return;
    }

    console.log("✅ Utilizator autentificat pentru behavior tracking:", userId?.substring(0, 10) + '***');

   
    if (self.behaviorTracker && typeof self.behaviorTracker.init === 'function') {
      self.behaviorTracker.init(userId, token).then(success => {
        if (success) {
          console.log("✅ Behavior tracker inițializat cu succes");
          startBehaviorMonitoring(userId, token);
        } else {
          console.error("❌ Eșec la inițializarea behavior tracker");
        }
      }).catch(error => {
        console.error("❌ Eroare la inițializarea behavior tracker:", error);
      });
    } else {
      console.error("❌ Behavior tracker nu este disponibil sau nu are metoda init");
      console.log("Available methods:", Object.getOwnPropertyNames(self.behaviorTracker || {}));
    }
  });
}


setTimeout(() => {
  initializeBehaviorTracker();
}, 1000);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.user || changes.token) {
    console.log("🔄 Detectată schimbare în autentificare, reinițializez behavior tracker...");
   
    setTimeout(() => {
      initializeBehaviorTracker();
    }, 500);
  }
});


chrome.storage.local.set({
  dlpConfig: {
    enabledPolicies: {
      pii: true,
      financial: true,
      credentials: false,
      medical: false,
      custom: false
    },
    blockLevel: 'warn',
    excludedDomains: ['login.', 'auth.', 'secure.']
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.user || changes.token) {
    console.log("🔄 Detectată schimbare în autentificare, reinițializez DLP...");
  }
});


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.user || changes.token) {
    console.log("🔄 Detectată schimbare în autentificare, reinițializez behavior tracker...");
    initializeBehaviorTracker();
  }
  
 
  if (changes.lastScan) sendMessageToPopup({ action: "updateUI", data: changes.lastScan.newValue });
  if (changes.blockedSites) sendMessageToPopup({ action: "updateBlockedCount", data: changes.blockedSites.newValue });
  if (changes.realTimeProtectionAds) updateAdBlocking(changes.realTimeProtectionAds.newValue);
});



function shouldSkipRequest(url) {
    const normalizedUrl = url.toLowerCase();
    const cached = urlCache.get(normalizedUrl);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("📋 Using cached result for:", normalizedUrl);
        // Use cached result instead of making new request
        handleCachedResult(cached.result, url);
        return true;
    }
    
    
    if (pendingRequests.has(normalizedUrl)) {
        console.log("⏳ Request already pending for:", normalizedUrl);
        return true;
    }
    
    return false;
}


function handleCachedResult(result, originalUrl) {
    chrome.storage.local.set({
        lastScan: {
            url: originalUrl,
            ...result,
            scanComplete: true,
            fromCache: true
        }
    });
    
   
    if (result.risk_score >= 50) {
       
        console.warn("🚨 Malicious site (cached):", originalUrl);
    }
}


function cacheResult(url, result) {
    const normalizedUrl = url.toLowerCase();
    urlCache.set(normalizedUrl, {
        result: result,
        timestamp: Date.now()
    });
    
    
    if (urlCache.size > 50) {
        const cutoff = Date.now() - CACHE_DURATION;
        for (const [url, cached] of urlCache.entries()) {
            if (cached.timestamp < cutoff) {
                urlCache.delete(url);
            }
        }
    }
}

function verifyUrl(url, tabId) {
  if (!url || 
    url.startsWith(chrome.runtime.getURL("")) || 
    url.startsWith("chrome://") || 
    //url.startsWith("localhost:") || 
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-search://") ||
    url.includes("google.com/search") ||
    url.includes("bing.com/search") ||
    url.includes("yahoo.com/search") ||
    url.includes("duckduckgo.com") ||
    url === "https://www.google.com/" ||
    url === "https://google.com/" ||
    url === "https://www.google.com" ||
    url === "https://google.com") {
    return;
  }

  if (shouldSkipRequest(url)) {
        return;
    }

  
    const normalizedUrl = url.toLowerCase();
    pendingRequests.set(normalizedUrl, Date.now());

  chrome.storage.local.get("skipNextScanFor", function (skipData) {
    if (skipData.skipNextScanFor === url) {
      chrome.storage.local.remove("skipNextScanFor");
      return;
    }

    chrome.storage.local.get(["userAcceptedRisk", "realTimeProtection"], function (data) {
      if (data.userAcceptedRisk === url) {
        chrome.storage.local.remove("userAcceptedRisk");
        return;
      }

      const protectionActive = data.realTimeProtection !== false;
      const domain = new URL(url).origin;
      const originalUrl = url;
      console.log("🔍 Verificare URL:", domain);

      
      if (protectionActive) {
      
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL("../html/scan-page.html")
        });

        chrome.storage.local.set({ 
          scanningUrl: originalUrl,
          scanningTabId: tabId,
          scanStartTime: Date.now()
        });
      }

      fetch("http://localhost:8080/api/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
        mode: "cors"
      })
      .then(response => {
        console.log("✅ Răspuns primit:", response.status);
         saveScanResult(data); 
        return response.json();
      })
      .then(data => {
        console.log("📩 Răspuns API:", data);
        cacheResult(domain, data);
          pendingRequests.delete(normalizedUrl);

          if (data.risk_score >= 50 && self.behaviorTracker && self.behaviorTracker.isActive) {
          self.behaviorTracker.processAlerts().then(() => {
          
            const alert = {
              type: 'sensitive_category_activity',
              message: `Tentativă de accesare site periculos: ${domain}`,
              severity: 'high',
              category: 'security',
              metadata: {
                risk_score: data.risk_score,
                final_decision: data.final_decision,
                blocked: protectionActive
              }
            };
            
            
            checkUserAuthentication((isAuth, userId, token) => {
              if (isAuth && self.behaviorTracker && self.behaviorTracker.isActive) {
                self.behaviorTracker.sendAlertsToBackend([alert]);
              }
            });
          });
        }

        chrome.storage.local.get(["siteHistory"], function (storage) {
          let siteHistory = storage.siteHistory || [];
          siteHistory.unshift({
            url: domain,
            finalDecision: data.final_decision
          });

          chrome.storage.local.set({
            lastScan: {
              url: domain,
              mlPrediction: data.ml_prediction,
              alienVault: data.alienvault_reported,
              riskScore: data.risk_score,
              finalDecision: data.final_decision,
              scanComplete: true,
              originalUrl: originalUrl
            },
            siteHistory 
          });
           chrome.runtime.sendMessage({ 
            action: "updateUI", 
            data: data.scanResult 
          });
        });



if (data.risk_score >= 50) {
          console.warn("🚨 Site detectat ca periculos! Risk score:", data.risk_score);
          
          // Actualizează contoarele de site-uri blocate
          chrome.storage.local.get(["blockedSites", "blockedDomains"], function (storage) {
            const domain = new URL(url).origin;
            let blockedCount = storage.blockedSites || 0;
            let blockedDomains = storage.blockedDomains || [];

            if (!blockedDomains.includes(domain)) {
              blockedDomains.push(domain);
              blockedCount++;

              chrome.storage.local.set({
                blockedSites: blockedCount,
                blockedDomains: blockedDomains
              });
            }
          });

          if (protectionActive) {
           
            console.log("🚫 Redirecționez către pagina de blocare...");
            chrome.storage.local.set({ lastBlockedUrl: url });
            
            
            chrome.tabs.update(tabId, {
              url: chrome.runtime.getURL("../html/blocked.html")
            });
          } else {
         
            chrome.runtime.sendMessage({
              action: "updateUI",
              scanDetails: {
                url: domain,
                mlPrediction: data.ml_prediction,
                alienVault: data.alienvault_reported,
                riskScore: data.risk_score,
                finalDecision: data.final_decision,
                isRisky: true
              }
            });
          }
        } else {
          
          console.log("✅ Site sigur detectat");
          
          if (protectionActive) {
           
            setTimeout(() => {
              chrome.storage.local.set({ skipNextScanFor: originalUrl }, () => {
                chrome.tabs.get(tabId, function(tab) {
                  if (tab && tab.url && tab.url.includes("scan-page.html")) {
                    chrome.tabs.update(tabId, { url: originalUrl });
                  }
                });
              });
            }, 3000);

        
            chrome.tabs.sendMessage(tabId, { 
              action: "scanComplete", 
              result: "safe",
              originalUrl: originalUrl,
              data: {
                url: domain,
                mlPrediction: data.ml_prediction,
                alienVault: data.alienvault_reported,
                riskScore: data.risk_score,
                finalDecision: data.final_decision
              }
            });
          } else {
           
            chrome.runtime.sendMessage({
              action: "updateUI",
              scanDetails: {
                url: domain,
                mlPrediction: data.ml_prediction,
                alienVault: data.alienvault_reported,
                riskScore: data.risk_score,
                finalDecision: data.final_decision,
                isRisky: false
              }
            });
          }
        }
      })
      .catch(error => {
        console.error("❌ Eroare la verificare:", error);
        pendingRequests.delete(normalizedUrl);
        
        if (protectionActive) {
          
          setTimeout(() => {
            chrome.storage.local.set({ skipNextScanFor: originalUrl }, () => {
              chrome.tabs.update(tabId, { url: originalUrl });
            });
          }, 3000);
        }
      });
    });
  });
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
   chrome.tabs.get(tabId, (tab) => {
    if (tab.url) {
      verifyUrl(tab.url, tabId);
      
     
      if (self.behaviorTracker && self.behaviorTracker.isActive) {
        console.log("🔄 Starting behavior session for new tab:", tab.url);
        self.behaviorTracker.startSession(tab.url, tabId);
      }
    }
   });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove("scannedFiles");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && 
      !tab.url.includes("scan-page.html") && 
      !tab.url.includes("blocked.html") &&
      !tab.url.startsWith(chrome.runtime.getURL(""))) {
    verifyUrl(tab.url, tabId);

   
    if (self.behaviorTracker && self.behaviorTracker.isActive && changeInfo.url) {
      console.log("🔄 URL changed, updating behavior session:", changeInfo.url);
      self.behaviorTracker.startSession(tab.url, tabId);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (self.behaviorTracker && self.behaviorTracker.isActive) {
    console.log("🔄 Tab closed, ending behavior session");
    self.behaviorTracker.endSession();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE && self.behaviorTracker && self.behaviorTracker.isActive) {
    console.log("🔄 Window focus changed, updating activity");
    self.behaviorTracker.updateActivity();
  }
});

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === "complete") {
      console.log("📥 Descărcare finalizată:", delta);

      chrome.downloads.search({ id: delta.id }, function (results) {
          const file = results[0];
          const filename = file.filename?.split(/[\\/]/).pop();

          fetch(file.url)
              .then(res => res.blob())
              .then(blob => {
                  const formData = new FormData();
                  formData.append("file", blob, filename || "file");

                  return fetch("http://localhost:8080/api/scan-file", {
                      method: "POST",
                      body: formData
                  });
              })
              .then(res => res.json())
              .then(data => {
                  chrome.storage.local.get("scannedFiles", function (storeData) {
                      let files = storeData.scannedFiles || [];
                      files.push({ 
                          filename: filename,
                          yaraResult: data.yaraMalicious,
                          isMalicious: data.isMalicious
                      });

                      console.log("Rezultatul scanării:", data);

                      chrome.storage.local.set({ scannedFiles: files }, () => {
                          chrome.runtime.sendMessage({ action: "updateScannedFiles", data: files });

                          const isMalicious = data.isMalicious;

                            const icon = chrome.runtime.getURL(isMalicious 
                                ? "../icons/warning.png" 
                                : "../icons/safe.png");

                            const logo = chrome.runtime.getURL("../icons/logo_16x16.png");

                            chrome.notifications.create({
                                type: "basic",
                                iconUrl: logo, 
                                title: "Scanat de GuardianBit",
                                message: `Fișierul ${filename} este ${isMalicious ? "malicios ❌! " : "curat ✅."}`,
                                priority: 1
                            });

                        
                          
                      });
                  });
              })
              .catch(error => {
                  console.error("❌ Eroare la scanarea fișierului descărcat:", error);

                 
                  chrome.notifications.create({
                      type: "basic",
                      iconUrl: "icons/error.png", 
                      title: "Eroare la scanare",
                      message: `Nu s-a putut scana fișierul ${filename}.`,
                      priority: 2
                  });
              });
      });
  }
});


function sendMessageToPopup(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) console.warn("⚠️ Popup-ul nu este deschis.");
    });
}


function updateAdBlocking(enable) {
    const enableRules = enable ? ["ruleset_1"] : [];
    const disableRules = enable ? [] : ["ruleset_1"];
    chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: enableRules,
        disableRulesetIds: disableRules
    });
}

chrome.storage.local.get("realTimeProtectionAds", (data) => {
    updateAdBlocking(data.realTimeProtectionAds !== false);
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Verifică dacă utilizatorul este autentificat
    if (message.action === "check_auth") {
        chrome.storage.local.get("user", function (data) {
            sendResponse({ authenticated: !!data.user, user: data.user });
        });
        return true;
    } 

    if (message.action === "storeDLPResults" && message.data) {
    chrome.storage.local.get(["dlpStats"], (res) => {
      const stats = res.dlpStats || [];
      stats.push({
        timestamp: Date.now(),
        sessionId: getCurrentSessionId(), 
        found: message.data
      });
      chrome.storage.local.set({ dlpStats: stats });
    });
  }

  if (message.action === "dlp_alert_detected") {
  const count = message.count;
  const types = message.types || [];

  const typeLabels = {
    cnp: "CNP",
    phone: "Telefon",
    email: "Email",
    iban: "IBAN",
    card: "Card",
    ci: "CI",
    passport: "Pașaport"
  };

  const detectedTypes = types.map(type => typeLabels[type] || type).join(", ");

  chrome.action.setBadgeText({ text: "DLP" });
  chrome.action.setBadgeBackgroundColor({ color: "#D32F2F" });

  chrome.notifications.create({
    type: "basic",
    iconUrl: "../icons/logo_48x48.png",
    title: "📛 Date sensibile detectate",
    message: `Au fost găsite ${count} elemente: ${detectedTypes}.`,
    priority: 2
  });
}


  if (message.action === "getDLPStats") {
    chrome.storage.local.get("dlpStats", (res) => {
      const all = res.dlpStats || [];
      const now = Date.now();
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const recent = all.filter(e => e.timestamp >= oneMonthAgo);
      const currentSessionId = getCurrentSessionId();
      const session = all.filter(e => e.sessionId === currentSessionId);

      sendResponse({
        lastMonth: recent.length,
        thisSession: session.length
      });
    });
    return true;
  }
    if (message.action === "scanTextDLP") {
  console.log('📨 Background: Primit text pentru scanare DLP:', message.text?.substring(0, 50) + '...');
  
 
  try {
   
    if (self.dlpEngine && typeof self.dlpEngine.scanTextForSensitiveData === 'function') {
      const results = self.dlpEngine.scanTextForSensitiveData(message.text);
      sendResponse({ found: results });
    } else {
     
      const dlpPatterns = {
        cnp: /\b[1-8]\d{12}\b/g,
        phone: /\b(?:\+4|0)?07\d{8}\b/g,
        email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}\b/gi,
        iban: /\bRO\d{2}[A-Z]{4}\d{16}\b/gi,
        card: /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14})\b/g,
        ci: /\b[A-Z]{2,3}\d{6}\b/gi,
        passport: /\b\d{8,9}\b/g
      };

      const found = {};
      Object.entries(dlpPatterns).forEach(([key, regex]) => {
        const matches = message.text.match(regex);
        if (matches && matches.length > 0) {
          found[key] = matches;
        }
      });

      console.log('📊 Background: DLP rezultate găsite:', found);
      sendResponse({ found: found });
    }
  } catch (error) {
    console.error('❌ Eroare în DLP background:', error);
    sendResponse({ found: {}, error: error.message });
  }
  return true; 
}
   
   
    if (message.action === "getBehaviorStats") {
        if (self.behaviorTracker && self.behaviorTracker.isActive && typeof self.behaviorTracker.getBehaviorStats === 'function') {
            self.behaviorTracker.getBehaviorStats().then(stats => {
                sendResponse({ success: true, data: stats });
            }).catch(error => {
                console.error("❌ Eroare la obținerea stats behavior:", error);
                sendResponse({ success: false, error: error.message });
            });
        } else {
            console.warn("⚠️ Behavior tracker nu este activ sau nu are metoda getBehaviorStats");
            console.log("Behavior tracker state:", {
                exists: !!self.behaviorTracker,
                isActive: self.behaviorTracker?.isActive,
                methods: self.behaviorTracker ? Object.getOwnPropertyNames(self.behaviorTracker) : []
            });
            sendResponse({ success: false, error: "Behavior tracker not initialized or not active" });
        }
        return true;
    }

    if (message.action === "getBehaviorTrackerStatus") {
        if (self.behaviorTracker && typeof self.behaviorTracker.getStatus === 'function') {
            try {
                const status = self.behaviorTracker.getStatus();
                sendResponse({
                    status: status,
                    isActive: self.behaviorTracker.isActive,
                    hasCurrentSession: !!self.behaviorTracker.currentSession
                });
            } catch (error) {
                console.error("❌ Error getting behavior tracker status:", error);
                sendResponse({ error: error.message });
            }
        } else {
            console.warn("⚠️ Behavior tracker nu are metoda getStatus");
            sendResponse({ 
                error: "Behavior tracker not properly initialized",
                available: !!self.behaviorTracker,
                methods: self.behaviorTracker ? Object.getOwnPropertyNames(self.behaviorTracker) : []
            });
        }
        return true;
    }
    

    if (message.action === "triggerTestAlert") {
        if (self.behaviorTracker && self.behaviorTracker.isActive) {
            self.behaviorTracker.triggerTestAlert().then(success => {
                sendResponse({ success: true, message: "Test alert sent" });
            }).catch(error => {
                console.error("❌ Eroare la trimiterea test alert:", error);
                sendResponse({ success: false, error: error.message });
            });
        } else {
            sendResponse({ success: false, error: "Behavior tracker not initialized" });
        }
        return true;
    }
    
    a
    if (message.action === "updateActivity") {
        if (self.behaviorTracker && self.behaviorTracker.isActive) {
            self.behaviorTracker.updateActivity();
            sendResponse({ success: true });
        }
        return true;
    }

    if (message.action === "continueToSite") {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
          chrome.storage.local.set({ skipNextScanFor: message.url }, () => {
            chrome.tabs.update(currentTab.id, { url: message.url });
          });
        }
      });
      return true;
    }
    
    if (message.action === "pwned_password_detected") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "../icons/logo_16x16.png", 
            title: "GuardianBit: Parolă compromisă",
            message: "⚠️ Parola introdusă a fost expusă în breșe de date cunoscute!",
            priority: 2
        });
        return true;
    }


    if (message.action === "renderBehaviorDashboard") {
        // Trimite datele către popup pentru a le afișa
        chrome.storage.local.get(["user", "behaviorData"], (data) => {
            chrome.runtime.sendMessage({
                action: "updateBehaviorDashboard",
                data: data
            });
        });
        return true;
    }
    
    if (message.action === "goBack") {
     
      chrome.tabs.goBack(sender.tab.id);
      return true;
    }

    if (message.action === "getScanStatus") {
        chrome.storage.local.get(["lastScan", "scanningUrl"], function(data) {
            sendResponse({
                scanComplete: data.lastScan?.scanComplete || false,
                scanResult: data.lastScan?.riskScore >= 50 ? "dangerous" : "safe",
                url: data.scanningUrl,
                scanDetails: data.lastScan
            });
        });
        return true;
    }   

 
    if (message.action === "getBehaviorTrackerStatus") {
        if (self.behaviorTracker) {
            sendResponse({
                status: self.behaviorTracker.getStatus(),
                isActive: self.behaviorTracker.isActive,
                hasCurrentSession: !!self.behaviorTracker.currentSession
            });
        } else {
            sendResponse({ error: "Behavior tracker not initialized" });
        }
        return true;
    }
});

chrome.runtime.onSuspend.addListener(() => {
  console.log("🔄 Extension suspending, cleaning up DLP...");
  
});

function getCurrentSessionId() {
  return new Date().toDateString(); 
}
const commonAdPatterns = [
    "*://*.doubleclick.net/*",
    "*://*.googlesyndication.com/*",
    "*://*.googleadservices.com/*",
    "*://*.google-analytics.com/*",
    "*://*.adnxs.com/*",
    "*://*.facebook.com/tr/*",
    "*://*.moatads.com/*",
    "*://*.advertising.com/*",
    "*://pagead2.googlesyndication.com/*",
    "*://*.scorecardresearch.com/*",
    "*://*.adriver.ru/*",
    "*://ad.mail.ru/*",
    "*://*.adfox.ru/*",
    "*://*.awaps.yandex.ru/*",
    "*://*.ads.avocet.io/*",
    "*://*.an.yandex.ru/*",
    "*://*.adform.net/*",
    "*://*.adtech.de/*"
  ];
  
 
  let adBlockingEnabled = false;
  

  chrome.storage.local.get(['adBlockEnabled'], function(result) {
    adBlockingEnabled = result.adBlockEnabled === true;
    
    if (adBlockingEnabled) {
      enableAdBlocking();
    }
  });
  
  chrome.runtime.onSuspend.addListener(() => {
  if (self.behaviorTracker && self.behaviorTracker.currentSession) {
    console.log("🔄 Saving behavior session on suspend...");
    self.behaviorTracker.endSession();
  }
});


 
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.adBlockEnabled) {
      adBlockingEnabled = changes.adBlockEnabled.newValue === true;
      
      if (adBlockingEnabled) {
        enableAdBlocking();
      } else {
        disableAdBlocking();
      }
    }
  });
  

  function enableAdBlocking() {
    // Adăugăm listener pentru webRequest
    chrome.webRequest.onBeforeRequest.addListener(
      blockAdsRequest,
      { urls: commonAdPatterns },
      ["blocking"]
    );
    
    
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, { action: "enableAdBlocking" }, function(response) {
          
          const lastError = chrome.runtime.lastError;
        });
      });
    });
  }
  

  function disableAdBlocking() {
    
    chrome.webRequest.onBeforeRequest.removeListener(blockAdsRequest);
    
   
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, { action: "disableAdBlocking" }, function(response) {
         
          const lastError = chrome.runtime.lastError;
        });
      });
    });
  }
  

  function blockAdsRequest(details) {
    if (adBlockingEnabled) {
     
      chrome.storage.local.get(['blockedAdsCount'], function(result) {
        const currentCount = result.blockedAdsCount || 0;
        chrome.storage.local.set({ blockedAdsCount: currentCount + 1 });
      });
      
      return { cancel: true };
    }
    return { cancel: false };
  }
  

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "getAdBlockStatus") {
      sendResponse({ enabled: adBlockingEnabled });
      return true;
    }
    
    if (message.action === "getBlockedAdsCount") {
      chrome.storage.local.get(['blockedAdsCount'], function(result) {
        sendResponse({ count: result.blockedAdsCount || 0 });
      });
      return true; 
    }
  });
  



function analyzeExternalJs(jsFileUrl) {
  console.log("📦 Încep analiză JS pentru:", jsFileUrl);

  fetch(jsFileUrl)
    .then(res => {
      console.log("📥 Descărcare JS reușită:", res.status);
      return res.blob();
    })
    .then(blob => {
      const formData = new FormData();
      formData.append('file', blob, 'script.js');

      console.log("🚀 Trimit spre backend Flask...");

      return fetch('http://localhost:8080/api/js/analyze', {
        method: 'POST',
        body: formData,
        mode: 'cors'  
      });
    })
    .then(res => {
      console.log("📬 Răspuns primit:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("🧠 JS analizat:", jsFileUrl, "| Rezultat:", data);

      if (data.prediction === "Obfuscated") {
          
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/warning.png",
            title: "GuardianBit - Alertă",
            message: `Script periculos detectat:\n${jsFileUrl}`,
            priority: 2
          });

        
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "showDangerousScriptWarning",
                scriptUrl: jsFileUrl
              });
            }
          });
        }

    })
    .catch(err => {
      console.error("❌ Eroare la analiză JS:", jsFileUrl, err);
    });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "externalScriptsFound") {
    console.log("📦 Scripturi externe primite de la content.js:", message.scripts);

    message.scripts.forEach(scriptUrl => {
      try {
        analyzeExternalJs(scriptUrl);
      } catch (err) {
        console.error(`❌ Eroare internă la analiza scriptului: ${scriptUrl}`, err);
      }
    });

    sendResponse({ status: "received" });
    return true;
  }

  return false;
});




  function scanTabScripts(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
     
      return [...document.scripts]
        .filter(s => s.src && s.src.startsWith("http"))
        .map(s => s.src);
    }
  }, (results) => {
    if (chrome.runtime.lastError || !results || !results[0]) {
      console.warn("Nu s-au putut extrage scripturi pentru tab:", tabId);
      return;
    }

    const jsUrls = results[0].result;
    if (jsUrls.length > 0) {
      console.log("🔎 Scripturi JS găsite automat pe pagină:", jsUrls);
     
      jsUrls.forEach(analyzeExternalJs);
    }
  });
}
  

  function startBehaviorMonitoring(userId, token) {
    console.log("🔄 Începe monitorizarea comportamentului avansată pentru:", userId?.substring(0, 10) + '***');

    
    const monitoringInterval = setInterval(async () => {
   
      if (self.behaviorTracker && self.behaviorTracker.isTracking) {
        
        const status = self.behaviorTracker.getStatus();
        console.log("📊 Behavior tracking status:", status);
      } else {
        console.warn("⚠️ Behavior tracker nu mai este activ, opresc monitorizarea");
        clearInterval(monitoringInterval);
      }
    }, 10 * 60 * 1000); 

  
    self.behaviorMonitoringInterval = monitoringInterval;
  }

// Funcția simplificată pentru trimiterea alertelor
function sendAlertToBackend(userId, token, alert) {
  fetch("http://localhost:8080/api/behavior/alerts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      userId: userId,
      alerts: [alert]
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Alertă trimisă:", data);
    })
    .catch(err => {
      console.error("❌ Eroare la trimiterea alertei:", err);
    });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("GuardianBit activ - monitorizare JS");
});
  
chrome.action.onClicked.addListener(() => {
    scanActiveTabScripts();
});


function saveScanResult(result) {
  if (!result || !result.url || !result.final_decision) return;

  chrome.storage.local.get(["siteHistory"], (data) => {
    const history = data.siteHistory || [];

    
    const alreadyExists = history.some(entry => entry.url === result.url);
    if (alreadyExists) return;

    history.push({
      url: result.url,
      finalDecision: result.final_decision,
      timestamp: Date.now()
    });

    chrome.storage.local.set({ siteHistory: history }, () => {
      console.log("💾 URL salvat în istoric:", result.url);
    });
  });
}



chrome.runtime.onSuspend.addListener(() => {
  console.log("🔄 Extension suspending, cleaning up behavior tracker...");
  if (self.behaviorTracker) {
    self.behaviorTracker.destroy();
  }
  if (self.behaviorMonitoringInterval) {
    clearInterval(self.behaviorMonitoringInterval);
  }
});