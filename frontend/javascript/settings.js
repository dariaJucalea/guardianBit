export function initSettings() {
    const protectionToggle = document.getElementById("real-time-protection");
    const adProtectionToggle = document.getElementById("real-time-protection-ads");
    const searchScanToggle = document.getElementById("search-scan-protection");
  
    if (searchScanToggle) {
      chrome.storage.local.get("searchScanProtection", (data) => {
        searchScanToggle.checked = data.searchScanProtection !== false;
      });
    
      searchScanToggle.addEventListener("change", () => {
        chrome.storage.local.set({ searchScanProtection: searchScanToggle.checked });
        console.log(`🔍 Scanare Google Search setată la: ${searchScanToggle.checked}`);
      });
    } else {
      console.warn("⚠️ Toggle-ul search-scan-protection lipsește!");
    }
    
    
    if (protectionToggle) {
      chrome.storage.local.get("realTimeProtection", (data) => {
        protectionToggle.checked = data.realTimeProtection !== false;
      });
  
      protectionToggle.addEventListener("change", () => {
        chrome.storage.local.set({ realTimeProtection: protectionToggle.checked });
        console.log(`🔄 Protecție site-uri setată la: ${protectionToggle.checked}`);
      });
    } else {
      console.warn("⚠️ Toggle-ul real-time-protection lipsește!");
    }
  
    if (adProtectionToggle) {
      chrome.storage.local.get("realTimeProtectionAds", (data) => {
        adProtectionToggle.checked = data.realTimeProtectionAds !== false;
      });
  
      adProtectionToggle.addEventListener("change", () => {
        chrome.storage.local.set({ realTimeProtectionAds: adProtectionToggle.checked });
        console.log(`📢 Protecție Ads setată la: ${adProtectionToggle.checked}`);
      });
    } else {
      console.warn("⚠️ Toggle-ul real-time-protection-ads lipsește!");
    }


    if (searchScanToggle) {
        chrome.storage.local.get("searchScanProtection", (data) => {
            searchScanToggle.checked = data.searchScanProtection !== false;
        });

        searchScanToggle.addEventListener("change", () => {
            chrome.storage.local.set({ searchScanProtection: searchScanToggle.checked });
            console.log(`🔍 Scanare rezultate căutare setată la: ${searchScanToggle.checked}`);
        });
    } else {
        console.warn("⚠️ Toggle-ul search-scan-protection lipsește!");
    }
  
   
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "malicious_script_detected") {
        alert("🚨 Script suspect detectat în pagina curentă!");
      }
    });
  }
  