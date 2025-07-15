
(function() {
  console.log('📝 DLP Input Scanner activat pentru:', window.location.href);

 
  if (window.dlpScannerActive) {
    console.log('⚠️ DLP Scanner deja activ pe această pagină');
    return;
  }
  window.dlpScannerActive = true;

  let isScanning = false;

  function scanInputValue(text, inputElement) {
    if (isScanning || !text || text.trim().length < 3) return;

    isScanning = true;
    console.log(`🔍 Scanare DLP pentru text: "${text.substring(0, 50)}..."`);

    try {
      chrome.runtime.sendMessage({
        action: "scanTextDLP",
        text: text,
        url: window.location.href
      }, (response) => {
        isScanning = false;

        if (chrome.runtime.lastError) {
          console.error("❌ Eroare la comunicarea cu background:", chrome.runtime.lastError.message);
          return;
        }

        if (response && response.found && Object.keys(response.found).length > 0) {
          const count = Object.values(response.found).reduce((acc, arr) => acc + arr.length, 0);
          const types = Object.keys(response.found);

          console.warn(`🚨 DLP: Detectate ${count} date sensibile:`, response.found);

        
          if (inputElement) {
            inputElement.style.border = '2px solid #ff4444';
            inputElement.style.boxShadow = '0 0 5px rgba(255, 68, 68, 0.5)';
            
        
            setTimeout(() => {
              inputElement.style.border = '';
              inputElement.style.boxShadow = '';
            }, 5000);
          }

         
          chrome.runtime.sendMessage({
            action: "dlp_alert_detected",
            count: count,
            types: types,
            url: window.location.href
          });

          
          chrome.runtime.sendMessage({
            action: "storeDLPResults",
            data: response.found
          });
        }
      });
    } catch (error) {
      isScanning = false;
      console.error("❌ Eroare în DLP scanner:", error);
    }
  }

  
  function handleInputEvent(e) {
    const target = e.target;
    
   
      if (target && (
        (target.tagName === "INPUT" && 
         ['text', 'email', 'tel', 'search', 'url', 'number'].includes(target.type) &&
         target.type !== 'password') ||  
        target.tagName === "TEXTAREA" ||
        target.contentEditable === 'true'
    )) {
      const text = target.value || target.textContent || target.innerText;
      
      if (text && text.trim().length >= 3) {
       
        clearTimeout(target.dlpTimeout);
        target.dlpTimeout = setTimeout(() => {
          scanInputValue(text, target);
        }, 500);
      }
    }
  }

 
  function handlePasteEvent(e) {
    const target = e.target;
    
   
    if (target && target.type === 'password') {
      console.log('🔒 DLP: Ignoră paste în câmp password - gestionat de content.js');
      return;
    }
    
    setTimeout(() => {
      if (target && (target.value || target.textContent)) {
        const text = target.value || target.textContent || target.innerText;
        scanInputValue(text, target);
      }
    }, 100);
  }

  
  document.addEventListener("input", handleInputEvent, true);
  document.addEventListener("paste", handlePasteEvent, true);

  
 function scanExistingInputs() {
  
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], ' +
      'input[type="search"], input[type="url"], input[type="number"], ' +
      'textarea, [contenteditable="true"]'
    );
    
    inputs.forEach(input => {
    
      if (input.type === 'password') {
        console.log('🔒 DLP: Saltă input password -', input);
        return;
      }
      
      const text = input.value || input.textContent || input.innerText;
      if (text && text.trim().length >= 3) {
        scanInputValue(text, input);
      }
    });
  }

 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanExistingInputs);
  } else {
    scanExistingInputs();
  }

  
 const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { 
         
          const inputs = node.matches && 
            node.matches('input:not([type="password"]), textarea, [contenteditable="true"]') 
            ? [node] 
            : node.querySelectorAll ? 
              node.querySelectorAll('input:not([type="password"]), textarea, [contenteditable="true"]') 
              : [];
          
          inputs.forEach(input => {
           
            if (input.type === 'password') {
              console.log('🔒 DLP Observer: Saltă input password');
              return;
            }
            
            const text = input.value || input.textContent || input.innerText;
            if (text && text.trim().length >= 3) {
              scanInputValue(text, input);
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("✅ DLP Input Scanner complet activat pe:", window.location.href);
})();