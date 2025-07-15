
console.log('🔒 Content.js se încarcă... Version 3.0');


try {
    console.log('🔒 Content.js - location:', window.location.href);
    console.log('🔒 Content.js - readyState:', document.readyState);
} catch (e) {
    console.error('🔒 Content.js - eroare la inițializare:', e);
}


if (window.contentScriptLoaded) {
    console.warn('🔒 Content.js deja încărcat, evit reîncărcarea');
} else {
    console.log('🔒 Content.js - prima încărcare pentru acest frame');
    window.contentScriptLoaded = true;
}


function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', resolve);
        }
    });
}

function waitForBody() {
    return new Promise((resolve) => {
        if (document.body) {
            resolve(document.body);
        } else {
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    resolve(document.body);
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    });
}

function waitForHead() {
    return new Promise((resolve) => {
        if (document.head) {
            resolve(document.head);
        } else {
            const observer = new MutationObserver(() => {
                if (document.head) {
                    observer.disconnect();
                    resolve(document.head);
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔒 Content.js primit mesaj:', message);
    
    if (message.action === "block_site") {
        console.log('🔒 Content.js - blocând site-ul...');
        
        waitForBody().then((body) => {
            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100vw";
            overlay.style.height = "100vh";
            overlay.style.background = "rgba(0, 0, 0, 0.9)";
            overlay.style.color = "white";
            overlay.style.display = "flex";
            overlay.style.flexDirection = "column";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "999999";
            overlay.innerHTML = `
                <h1 style="font-size: 50px;">🚨 SITE PERICULOS!</h1>
                <p style="font-size: 20px;">Acest site a fost blocat pentru siguranța ta.</p>
                <button id="closeTab" style="margin-top: 20px; padding: 10px 20px; font-size: 18px; background: white; color: red; border: none; cursor: pointer;">
                    Închide Tab-ul
                </button>
            `;

            body.appendChild(overlay);

            document.getElementById("closeTab").addEventListener("click", () => {
                window.close();
            });
            
            sendResponse({success: true});
        }).catch(e => {
            console.error('🔒 Nu s-a putut bloca site-ul:', e);
            sendResponse({success: false, error: e.message});
        });
        
        return true; 
    }
    
    if (message.action === "test_from_content") {
        console.log('🔒 Content.js - răspund la test');
        sendResponse({success: true, timestamp: Date.now()});
    }
    
    return true; 
});





waitForDOM().then(() => {
    document.addEventListener("click", function (event) {
        const link = event.target.closest("a");
        if (!link || !link.href) return;
      
        const downloadExtensions = [".exe", ".zip", ".rar", ".pdf", ".mp3", ".mp4", ".doc", ".docx", ".xls", ".xlsx"];
        const isDownloadLink = downloadExtensions.some(ext => link.href.toLowerCase().endsWith(ext));
      
        if (isDownloadLink) {
            event.preventDefault(); 
            console.log("🔎 Link interceptat pentru scanare:", link.href);
            chrome.runtime.sendMessage({
                action: "scan_before_download",
                url: link.href
            });
        }
    });
});



const externalScripts = [...document.scripts]
  .filter(script => script.src)
  .map(script => script.src);


chrome.runtime.sendMessage({
  action: "externalScriptsFound",
  scripts: externalScripts
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "block_download") {
        console.log('🔒 Content.js - blocând download...');
        
        waitForBody().then((body) => {
            const warningOverlay = document.createElement("div");
            warningOverlay.style.position = "fixed";
            warningOverlay.style.top = "0";
            warningOverlay.style.left = "0";
            warningOverlay.style.width = "100vw";
            warningOverlay.style.height = "100vh";
            warningOverlay.style.background = "rgba(0, 0, 0, 0.85)";
            warningOverlay.style.color = "white";
            warningOverlay.style.display = "flex";
            warningOverlay.style.flexDirection = "column";
            warningOverlay.style.justifyContent = "center";
            warningOverlay.style.alignItems = "center";
            warningOverlay.style.zIndex = "999999";
      
            warningOverlay.innerHTML = `
                <h1>🚨 Fișier potențial periculos!</h1>
                <p>Descărcarea a fost blocată pentru siguranța ta.</p>
                <p><small>${message.url}</small></p>
                <button id="dismissWarning" style="padding: 10px 20px; background: white; color: red; border: none; margin-top: 20px; cursor: pointer;">
                    Închide
                </button>
            `;
      
            body.appendChild(warningOverlay);
      
            document.getElementById("dismissWarning").addEventListener("click", () => {
                warningOverlay.remove();
            });
            
            sendResponse({success: true});
        }).catch(e => {
            console.error('🔒 Nu s-a putut bloca download:', e);
            sendResponse({success: false, error: e.message});
        });
        
        return true; 
    }
    
    return true;
});


let adBlockingEnabled = false;

const adSelectors = [
    '.ad', '.ads', '.adsbygoogle', '.advertisement', '.banner-ads', '.banner_ad',
    'div[id*="advert"]', 'div[class*="ad-container"]', 'div[id*="google_ads"]',
    'div[class*="sponsored"]', 'iframe[src*="ads"]', 'ins.adsbygoogle',
    'div[class*="publicidade"]', 'div[id*="publicidade"]', 'div[data-ad-status]',
    'div[class*="reklama"]', 'div[id*="reklama"]'
];

let observer;


chrome.storage.local.get(['adBlockEnabled'], function(result) {
    adBlockingEnabled = result.adBlockEnabled === true;
    console.log('🔒 Content.js - Ad blocking enabled:', adBlockingEnabled);
    if (adBlockingEnabled) {
       
        
            hideAds();
            observeDOM();
    
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('🔒 Content.js - primit mesaj ad blocking:', message);
    
    if (message.action === "enableAdBlocking") {
        adBlockingEnabled = true;
        waitForBody().then(() => {
            hideAds();
            observeDOM();
            sendResponse({ status: "enabled" });
        });
        return true; 
    }
    
    if (message.action === "disableAdBlocking") {
        adBlockingEnabled = false;
        showAds();
        disconnectObserver();
        sendResponse({ status: "disabled" });
    }
    
    return true;
});

async function hideAds() {
    try {
        await waitForBody();
        
        adSelectors.forEach(selector => {
            const adElements = document.querySelectorAll(selector);
            let count = 0;
            
            adElements.forEach(el => {
                if (el && el.style) {
                    if (!el.dataset.originalDisplay) {
                        el.dataset.originalDisplay = el.style.display || '';
                    }
                    el.style.display = 'none';
                    count++;
                }
            });
            
            if (count > 0) {
                chrome.runtime.sendMessage({
                    action: 'adsBlocked',
                    count: count
                });
            }
        });
        
        blockAdIframes();
    } catch (e) {
        console.warn('🔒 Eroare la ascunderea reclamelor:', e);
    }
}

function showAds() {
    try {
        adSelectors.forEach(selector => {
            const adElements = document.querySelectorAll(selector);
            adElements.forEach(el => {
                if (el && el.style && el.dataset.originalDisplay !== undefined) {
                    el.style.display = el.dataset.originalDisplay;
                }
            });
        });
    } catch (e) {
        console.warn('🔒 Eroare la afișarea reclamelor:', e);
    }
}

async function observeDOM() {
    try {
        await waitForBody();
        
        if (observer) {
            disconnectObserver();
        }
        
        observer = new MutationObserver(function(mutations) {
            if (adBlockingEnabled) {
                const shouldCheckForAds = mutations.some(mutation => 
                    mutation.addedNodes && mutation.addedNodes.length > 0
                );
                if (shouldCheckForAds) {
                    hideAds();
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } catch (e) {
        console.warn('🔒 Eroare la configurarea observer-ului:', e);
    }
}

function disconnectObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

async function blockAdIframes() {
    try {
        if (!adBlockingEnabled) return;
        
        const iframes = document.querySelectorAll('iframe');
        let blockedCount = 0;
        
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            if (
                src.includes('doubleclick.net') ||
                src.includes('googlesyndication.com') ||
                src.includes('adnxs.com') ||
                src.includes('ad-delivery') ||
                src.includes('/ads/') ||
                src.includes('/ad/')
            ) {
                if (!iframe.dataset.originalDisplay) {
                    iframe.dataset.originalDisplay = iframe.style.display || '';
                }
                iframe.style.display = 'none';
                blockedCount++;
            }
        });
        
        if (blockedCount > 0) {
            chrome.runtime.sendMessage({
                action: 'adsBlocked',
                count: blockedCount,
                type: 'iframe'
            });
        }
    } catch (e) {
        console.warn('🔒 Eroare la blocarea iframe-urilor:', e);
    }
}


waitForDOM().then(() => {
    console.log('🔒 Content.js - DOM ready pentru ad blocking');
    if (adBlockingEnabled) {
        hideAds();
        observeDOM();
    }
});

waitForBody().then(() => {
    console.log('🔒 Content.js - body ready');
    window.addEventListener('load', function() {
        console.log('🔒 Content.js - window loaded');
        if (adBlockingEnabled) {
            setTimeout(hideAds, 1000);
        }
    });
});


console.log('🔒 Password Security Scanner activat pentru:', window.location.href);


if (window.passwordSecurityActive) {
    console.log('⚠️ Password Security Scanner deja activ pe această pagină');
} else {
    window.passwordSecurityActive = true;


    const checkedPasswordHashes = new Set();


    function sha1(msg) {
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        return crypto.subtle.digest("SHA-1", data).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('').toUpperCase();
        });
    }


    async function checkPwnedPassword(password) {
        const fullHash = await sha1(password);
        
        if (checkedPasswordHashes.has(fullHash)) {
            return checkedPasswordHashes.has(fullHash + "_pwned");
        }
        
        checkedPasswordHashes.add(fullHash);
        const prefix = fullHash.slice(0, 5);
        const suffix = fullHash.slice(5);

        try {
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            const text = await response.text();
            const hashLines = text.split('\n');
            let isPwned = false;
            
            for (const line of hashLines) {
                const [hashSuffix] = line.split(':');
                if (hashSuffix.toUpperCase() === suffix.toUpperCase()) {
                    isPwned = true;
                    checkedPasswordHashes.add(fullHash + "_pwned");
                    break;
                }
            }
            
            return isPwned;
        } catch (error) {
            console.error("❌ Eroare la verificarea parolei:", error);
            return false;
        }
    }

   
    const pwnedPasswordStyles = `
        .pwned-password-warning {
            position: absolute;
            background-color: #ff4d4d;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            margin-top: 5px;
            max-width: 250px;
            pointer-events: none;
        }
    `;

    async function injectStyles() {
        try {
            const head = await waitForHead();
            
           
            if (document.getElementById('pwned-password-styles')) {
                console.log("✅ Stiluri password security deja injectate");
                return;
            }

            const styleElement = document.createElement('style');
            styleElement.id = 'pwned-password-styles';
            styleElement.textContent = pwnedPasswordStyles;
            head.appendChild(styleElement);
            console.log("✅ Stiluri password security injectate în <head>");
        } catch (e) {
            console.warn("❌ Nu s-a putut injecta stilurile:", e);
        }
    }

    
    function findPasswordInputs() {
        const selectors = [
            'input[type="password"]',
            'input[autocomplete*="password"]',
            'input[name*="password" i]',
            'input[id*="password" i]',
            'input[class*="password" i]',
            'input[aria-label*="password" i]'
        ];
        
        const passwordInputs = document.querySelectorAll(selectors.join(','));
        console.log(`🔍 Găsite ${passwordInputs.length} inputuri de tip password`);
        
        return [...passwordInputs];
    }


    function showPwnedWarning(inputElement) {
        removePwnedWarning(inputElement);
        
        try {
            if (!inputElement.dataset.pwnedContainerCreated) {
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.display = 'inline-block';
                container.style.width = inputElement.offsetWidth + 'px';
                
                inputElement.parentNode.insertBefore(container, inputElement);
                container.appendChild(inputElement);
                inputElement.dataset.pwnedContainerCreated = 'true';
            }
            
            const warningElement = document.createElement('div');
            warningElement.className = 'pwned-password-warning';
            warningElement.textContent = '⚠️ GuardianBit: Această parolă a fost compromisă în breșe de date!';
            warningElement.style.position = 'absolute';
            warningElement.style.top = '100%';
            warningElement.style.left = '0';
            warningElement.style.zIndex = '9999';
            
            const warningId = `pwned-warning-${Math.random().toString(36).substr(2, 9)}`;
            warningElement.id = warningId;
            inputElement.dataset.pwnedWarningId = warningId;
            
            inputElement.parentNode.appendChild(warningElement);
        } catch (e) {
            console.warn("❌ Nu s-a putut afișa avertismentul vizual:", e);
        }
        
      
        chrome.runtime.sendMessage({
            action: "pwned_password_detected"
        });
        
        try {
            inputElement.style.borderColor = '#ff4d4d';
            inputElement.style.boxShadow = '0 0 0 1px #ff4d4d';
        } catch (e) {
            console.warn("❌ Nu s-a putut schimba stilul inputului:", e);
        }
    }

    
    function removePwnedWarning(inputElement) {
        try {
            const warningId = inputElement.dataset.pwnedWarningId;
            if (warningId) {
                const warningElement = document.getElementById(warningId);
                if (warningElement) {
                    warningElement.remove();
                }
                delete inputElement.dataset.pwnedWarningId;
            }
            
            inputElement.style.borderColor = '';
            inputElement.style.boxShadow = '';
        } catch (e) {
            console.warn("❌ Eroare la eliminarea avertismentului:", e);
        }
    }

    
    function setupPasswordInput(input) {
    
        if (input.type !== 'password' && 
            !input.autocomplete?.includes('password') &&
            !input.name?.toLowerCase().includes('password') &&
            !input.id?.toLowerCase().includes('password')) {
            console.log('🔒 Saltă input non-password:', input);
            return;
        }

        if (input.dataset.passwordCheckerInitialized) {
            console.log('🔒 Input password deja inițializat:', input);
            return;
        }
        
        input.dataset.passwordCheckerInitialized = 'true';
        console.log('🔒 Configurez input password:', input);
        
        let timeoutId;
        
       
        input.addEventListener('input', () => {
            removePwnedWarning(input);
            clearTimeout(timeoutId);
            
            const value = input.value;
            if (value && value.length >= 8) {
                timeoutId = setTimeout(async () => {
                    console.log('🔍 Verifică parola compromisă...');
                    const isPwned = await checkPwnedPassword(value);
                    if (isPwned) {
                        console.warn('🚨 Parolă compromisă detectată!');
                        showPwnedWarning(input);
                    } else {
                        console.log('✅ Parola pare sigură');
                    }
                }, 800);
            }
        });
        
      
        input.addEventListener('blur', async () => {
            clearTimeout(timeoutId);
            const value = input.value;
            if (value && value.length >= 8) {
                console.log('🔍 Verifică parola la blur...');
                const isPwned = await checkPwnedPassword(value);
                if (isPwned) {
                    console.warn('🚨 Parolă compromisă detectată la blur!');
                    showPwnedWarning(input);
                }
            }
        });
        
       
        const form = input.closest('form');
        if (form) {
            try {
                form.addEventListener('submit', async (event) => {
                    const value = input.value;
                    if (value && value.length >= 8) {
                        console.log('🔍 Verifică parola la submit...');
                        const isPwned = await checkPwnedPassword(value);
                        if (isPwned) {
                            event.preventDefault();
                            showPwnedWarning(input);
                            input.focus();
                            
                            const wantsToSubmit = confirm('🚨 Parola introdusă a fost compromisă în breșe de date. Continuați oricum?');
                            if (wantsToSubmit) {
                                setTimeout(() => {
                                    form.submit();
                                }, 100);
                            }
                        }
                    }
                }, true);
            } catch (e) {
                console.warn("❌ Nu s-a putut adăuga listener pentru submit:", e);
            }
        }
    }

    
    function scanForHiddenPasswordInputs() {
        const passwordRegex = /passw|pwd|passcode|security|login/i;
        
        document.querySelectorAll('input[type="text"]').forEach(input => {
            if (
                passwordRegex.test(input.name) || 
                passwordRegex.test(input.id) ||
                input.autocomplete === 'current-password' ||
                input.autocomplete === 'new-password' ||
                (input.placeholder && passwordRegex.test(input.placeholder))
            ) {
                setupPasswordInput(input);
            }
        });
        
        document.querySelectorAll('input[type="hidden"]').forEach(input => {
            if (
                (input.name && passwordRegex.test(input.name)) || 
                (input.id && passwordRegex.test(input.id))
            ) {
                const value = input.value;
                if (value && value.length >= 8) {
                    checkPwnedPassword(value).then(isPwned => {
                        if (isPwned) {
                            chrome.runtime.sendMessage({
                                action: "pwned_password_detected"
                            });
                        }
                    });
                }
            }
        });
    }

 
    async function initPasswordSecurity() {
        console.log('🔒 Inițializez Password Security Scanner...');
        
       
        await injectStyles();
        
        try {
            
            await waitForBody();
            
            
            const testDiv = document.createElement('div');
            testDiv.style.display = 'none';
            document.body.appendChild(testDiv);
            document.body.removeChild(testDiv);
            
          
            const passwordObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(node => {
                            if (node.tagName === 'INPUT' && node.type === 'password') {
                                console.log('🔒 Input password nou detectat:', node);
                                setupPasswordInput(node);
                            } else if (node.querySelectorAll) {
                                const newPasswordInputs = node.querySelectorAll('input[type="password"]');
                                newPasswordInputs.forEach(input => {
                                    console.log('🔒 Input password nou detectat în subtree:', input);
                                    setupPasswordInput(input);
                                });
                            }
                        });
                    }
                }
            });
            
            passwordObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
     
            const existingPasswordInputs = findPasswordInputs();
            existingPasswordInputs.forEach(setupPasswordInput);
            
        
            setInterval(() => {
                const passwordInputs = findPasswordInputs();
                passwordInputs.forEach(input => {
                    if (!input.dataset.passwordCheckerInitialized) {
                        setupPasswordInput(input);
                    }
                });
                scanForHiddenPasswordInputs();
            }, 5000);
            
            console.log('✅ Password Security Scanner complet activat');
            
        } catch (e) {
            console.warn("❌ Eroare la testul DOM - folosind modul restrictiv:", e);
            
        
            waitForDOM().then(() => {
                document.querySelectorAll('input[type="password"]').forEach(input => {
                    input.addEventListener('change', async () => {
                        if (input.value && input.value.length >= 8) {
                            const isPwned = await checkPwnedPassword(input.value);
                            if (isPwned) {
                                chrome.runtime.sendMessage({
                                    action: "pwned_password_detected"
                                });
                            }
                        }
                    });
                });
            });
        }
    }

 
    initPasswordSecurity();
}

console.log('✅ content.js complet încărcat - gestionează: site blocking, ads, downloads și PASSWORD SECURITY');