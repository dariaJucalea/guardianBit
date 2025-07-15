
export function initScan() {
  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadFileButton");
  const uploadStatus = document.getElementById("uploadStatus");
  const scanProgress = document.getElementById("scanProgress");
  const scanResult = document.getElementById("scanResult");

  if (!fileInput || !uploadButton || !uploadStatus || !scanProgress || !scanResult) {
    console.warn("⚠️ Elementele necesare pentru scanare nu au fost găsite în DOM.");
    return;
  }

  uploadButton.addEventListener("click", () => {
    if (!fileInput.files.length) {
      uploadStatus.innerText = "❌ Selectează un fișier!";
      return;
    }

    const file = fileInput.files[0];
    uploadStatus.innerText = "⏳ Se încarcă fișierul...";
    scanProgress.style.display = "block";
    scanProgress.value = 10;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;

      crypto.subtle.digest("SHA-256", arrayBuffer).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        scanProgress.value = 50;

        
        const formData = new FormData();
        formData.append("file", file);

        fetch("http://localhost:8080/api/scan-file", {
          method: "POST",
          body: formData
        })
        .then(res => res.json())
        .then(data => {
          scanProgress.value = 100;
          uploadStatus.innerText = "✅ Fișier încărcat cu succes!";
          uploadStatus.style.color = "green";
          scanResult.innerHTML = `<strong>Rezultat scanare:</strong> ${data.isMalicious ? "🚨 Periculos" : "✅ Sigur"}`;
          if(data.isMalicious){
            scanResult.innerHTML += `<br><strong>Motiv:</strong> ${data.reason}`;
          }
          console.log("Rezultatul scanării:", data);
          scanResult.style.display = "block";

          
          chrome.storage.local.get("scannedFiles", function (storeData) {
            let files = storeData.scannedFiles || [];
            files.unshift({
              filename: file.name,
              yaraResult: data.yaraMalicious,
              isMalicious: data.isMalicious,
              scanDate: new Date().toISOString(),
              filePath: file.webkitRelativePath || "N/A", 
              fileSize: file.size,
              mimeType: file.type,
              reason:data.reason
            });
            
            chrome.storage.local.set({ scannedFiles: files }, () => {
             
              import('./ui.js').then(uiModule => {
                if (typeof uiModule.displayScannedFiles === 'function') {
                  uiModule.displayScannedFiles(files);
                } else {
                 
                  displayScannedFiles(files);
                }
              }).catch(err => {
                console.error("Nu s-a putut importa ui.js:", err);
                displayScannedFiles(files);
              });
              
              chrome.runtime.sendMessage({ action: "updateScannedFiles", data: files });
            });
          });
        })
        .catch(error => {
          console.error("❌ Eroare la trimiterea fișierului:", error);
          uploadStatus.innerText = "❌ Eroare la trimiterea fișierului!";
          uploadStatus.style.color = "red";
        });
      });
    };

    reader.readAsArrayBuffer(file);
  });

  chrome.storage.local.get("scannedFiles", function (data) {
    if (data.scannedFiles) {
      
      import('./ui.js').then(uiModule => {
        if (typeof uiModule.displayScannedFiles === 'function') {
          uiModule.displayScannedFiles(data.scannedFiles);
        } else {
          displayScannedFiles(data.scannedFiles);
        }
      }).catch(err => {
        console.error("Nu s-a putut importa ui.js:", err);
        displayScannedFiles(data.scannedFiles);
      });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateScannedFiles" && message.data) {
      const files = message.data;
      
      import('./ui.js').then(uiModule => {
        if (typeof uiModule.displayScannedFiles === 'function') {
          uiModule.displayScannedFiles(files);
        } else {
          displayScannedFiles(files);
        }
      }).catch(err => {
        console.error("Nu s-a putut importa ui.js:", err);
        displayScannedFiles(files);
      });
    }
  });
}


function displayScannedFiles(files) {
  const fileList = document.getElementById('scanList');
  const emptyState = document.querySelector('.empty-state');
  
  if (!fileList) {
    console.error("❌ Elementul scanList lipsește din HTML!");
    return;
  }
  
  fileList.innerHTML = "";
  
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

 
    const fileName = truncateFilename(file.filename || 'Necunoscut');
    
    li.innerHTML = `
      <span class="file-name tooltip-wrapper">
        ${fileName}
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


function truncateFilename(name, maxLength = 25) {
  if (name.length <= maxLength) return name;

  const extIndex = name.lastIndexOf(".");
  const ext = extIndex !== -1 ? name.slice(extIndex) : "";
  const base = name.slice(0, maxLength - ext.length - 3);

  return `${base}...${ext}`;
}
