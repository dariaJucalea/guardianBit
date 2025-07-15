import { initAuth } from "./auth.js";
import { initUI} from "./ui.js";
import { initScan } from "./scan.js";
import { initSettings } from "./settings.js";

export function isJwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    console.error("❌ Eroare la verificarea tokenului:", e);
    return true;
  }
}


document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Popup loaded!");
  initAuth();
  initUI();
  initScan();
  initSettings();

  

  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
      const input = icon.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
      } else {
        input.type = 'password';
        icon.textContent = '👁️';
      }
    });
  });
});

export function updateAdBlockBadge(isEnabled) {
  if (isEnabled) {
    chrome.action.setBadgeText({ text: "AD" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  } else {
 
    chrome.action.setBadgeText({ text: "" });
  }
}
function scanPageForDLP() {
  chrome.tabs.executeScript({
    code: "document.body.innerText"
  }, (results) => {
    const pageText = results[0];
    chrome.runtime.sendMessage({ action: "scanTextDLP", text: pageText }, (res) => {
      if (res.found && Object.keys(res.found).length > 0) {
        chrome.runtime.sendMessage({ action: "storeDLPResults", data: res.found });

    
        const count = Object.values(res.found).reduce((acc, list) => acc + list.length, 0);
        chrome.runtime.sendMessage({
          action: "dlp_alert_detected",
          count: count
        });
      }
    });
  });
}



export function updateAdsBlockedStats(count) {

  const adsBlockedCount = document.getElementById('ads-blocked-count');
  if (adsBlockedCount) {
    adsBlockedCount.textContent = count;
  }
}

export function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/logo_48x48.png',
    title: title,
    message: message
  });
}