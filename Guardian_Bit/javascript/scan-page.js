
document.addEventListener('DOMContentLoaded', function() {
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const scanDetails = document.getElementById('scanDetails');
    const countdown = document.getElementById('countdown');
    const container = document.getElementById('scanContainer');
    const logoElement = document.querySelector('.logo');
    
    let originalUrl = '';
    let countdownInterval;
    
   
    setTimeout(() => {
        progressBar.style.width = '100%';
    }, 100);
    
   
    chrome.runtime.sendMessage({ action: "getScanStatus" }, function(response) {
        if (response && response.scanComplete) {
            showResults(response);
        }
        
        if (response && response.url) {
            originalUrl = response.url;
            document.getElementById('scannedUrl').textContent = new URL(response.url).origin;
        }
    });
    
   
    chrome.runtime.onMessage.addListener(function(message) {
        if (message.action === "scanComplete") {
            showResults({
                scanResult: message.result,
                scanDetails: message.scanDetails,
                url: message.originalUrl
            });
            
            originalUrl = message.originalUrl;
        }
    });
    
    function showResults(response) {
       
        logoElement.classList.remove('pulse');
        
       
        statusText.textContent = response.scanResult === "dangerous" 
            ? "❌ Site potențial periculos detectat!" 
            : "✅ Site verificat și sigur!";
        
        
        if (response.scanResult === "dangerous") {
            container.style.boxShadow = "0 4px 20px rgba(244, 67, 54, 0.3)";
        } else {
            container.style.boxShadow = "0 4px 20px rgba(76, 175, 80, 0.3)";
        }
        
       
        if (response.scanDetails) {
            document.getElementById('mlPrediction').textContent = 
                response.scanDetails.mlPrediction ? "Posibil periculos" : "Probabil sigur";
            document.getElementById('mlPrediction').className = 
                response.scanDetails.mlPrediction ? "result-danger" : "result-safe";
            
            document.getElementById('alienVault').textContent = 
                response.scanDetails.alienVault ? "DA" : "NU";
            document.getElementById('alienVault').className = 
                response.scanDetails.alienVault ? "result-danger" : "result-safe";
            
            document.getElementById('riskScore').textContent = 
                `${response.scanDetails.riskScore}/100`;
            document.getElementById('riskScore').className = 
                response.scanDetails.riskScore >= 50 ? "result-danger" : "result-safe";
            
            document.getElementById('finalDecision').textContent = 
                response.scanDetails.finalDecision === "MALICIOUS" ? "BLOCAT" : "PERMIS";
            document.getElementById('finalDecision').className = 
                response.scanDetails.finalDecision === "MALICIOUS" ? "result-danger" : "result-safe";
        }
        
        
        scanDetails.style.display = "block";
        
       
        if (response.scanResult !== "dangerous") {
            let secondsLeft = 3;
            countdown.textContent = `Veți fi redirecționat către site în ${secondsLeft} secunde...`;
            countdown.style.display = "block";
            
            countdownInterval = setInterval(() => {
                secondsLeft--;
                countdown.textContent = `Veți fi redirecționat către site în ${secondsLeft} secunde...`;
                
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 1000);
        }
    }
});