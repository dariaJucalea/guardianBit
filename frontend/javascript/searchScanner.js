// === Funcție principală de scanare ===
function scanSearchResults() {
    chrome.storage.local.get("searchScanProtection", (data) => {
        if (data.searchScanProtection === false) {
            console.log("🔕 Scanare dezactivată, badge-urile nu vor fi afișate.");
            return;
        }

        console.log("🔍 Scanare rezultate Google Search...");

        const results = Array.from(document.querySelectorAll('a[href^="http"]'))
            .filter(link => link.hostname !== 'www.google.com');

        console.log(`✅ Găsite ${results.length} linkuri valide.`);

        results.forEach((link) => {
            const domain = new URL(link.href).origin;

            fetch("http://localhost:8080/api/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: domain }),
                mode: "cors"
            })
            .then(response => {
                if (!response.ok) throw new Error(`Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                addSecurityBadge(link, data.risk_score, data.ml_prediction, data.alienvault_reported, data.final_decision);
            })
            .catch(err => {
                console.warn(`❌ Eroare la scanarea ${domain}:`, err);
            });
        });
    });
}


// === Funcție de adăugare badge + tooltip ===
function addSecurityBadge(link, riskScore, mlPrediction, alienvaultReported, finalDecision) {
    if (link.hasAttribute("data-guardianbit-badge")) return;
    link.setAttribute("data-guardianbit-badge", "true");

    // === Creează badge ===
    const badge = document.createElement("span");

// Badge rotund cu simbol ✔ sau ⚠ în centru, culoare în fundal
badge.textContent = riskScore >= 50 ? "×" : "●";  // solid = sigur


badge.style.cssText = `
    all: initial;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 50%;
    background-color: ${riskScore >= 50 ? '#E53E3E' : '#38A169'};
    color: white;
    border: 2px solid ${riskScore >= 50 ? '#9B2C2C' : '#2F855A'};
    cursor: pointer;
    transition: transform 0.2s ease;
    margin-left: 6px;
`;

badge.addEventListener("mouseenter", () => {
    badge.style.transform = "scale(1.25)";
    const rect = badge.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.opacity = "1";
});
badge.addEventListener("mouseleave", () => {
    badge.style.transform = "scale(1)";
    tooltip.style.opacity = "0";
});



   
    const tooltip = document.createElement("div");
    tooltip.innerHTML = `
        <b>🔍 Scanat de GuardianBit</b><br/>
        <b>Scor risc:</b> ${riskScore}/100<br/>
        <b>Decizie:</b> ${finalDecision}
    `;

    tooltip.style.cssText = `
        all: initial;
        position: fixed;
        background: #4A5568;
        color: #fff;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-family: sans-serif;
        white-space: pre-line;
        opacity: 0;
        pointer-events: none;
        z-index: 999999;
        box-shadow: 0 0 10px rgba(0,0,0,0.25);
        transition: opacity 0.2s ease;

        direction: ltr !important;
        unicode-bidi: isolate !important;
        writing-mode: horizontal-tb !important;
        text-orientation: upright !important;
        text-align: left !important;
        line-height: 1;
    `;
    document.body.appendChild(tooltip);

    badge.addEventListener("mouseenter", () => {
        const rect = badge.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.opacity = "1";
    });

    badge.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
    });

  
    const wrapper = document.createElement("span");
    wrapper.style.cssText = `
        display: inline-block;
        margin-left: 2 px;
        direction: ltr !important;
        unicode-bidi: isolate !important;
        transform: rotate(0deg) scale(1) !important;
    `;
    wrapper.appendChild(badge);

   
    const title = link.querySelector('h3') || link.closest('.g')?.querySelector('h3');
    if (title && title.parentElement) {
        const spanWrapper = document.createElement('span');
        spanWrapper.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transform: none !important;
            writing-mode: horizontal-tb !important;
            direction: ltr !important;
            unicode-bidi: isolate !important;
        `;

        const clonedTitle = title.cloneNode(true);
        title.replaceWith(spanWrapper);
        spanWrapper.appendChild(clonedTitle);
        spanWrapper.appendChild(wrapper);
    } else if (link.parentElement) {
        link.parentElement.insertBefore(wrapper, link.nextSibling);
    }
}



function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}


function setupObserver() {
    const container = document.querySelector('#rso') || document.querySelector('#search') || document.body;
    if (!container) return;

    const observer = new MutationObserver(() => {
        debounce(scanSearchResults, 500)();
    });

    observer.observe(container, { childList: true, subtree: true });
    console.log("👁️ Observer activat pentru rezultate dinamice.");
}


function isGoogleSearch() {
    return location.hostname.includes("google") && (location.pathname.includes("/search") || location.search.includes("?q="));
}


if (isGoogleSearch()) {
    console.log("🚀 Inițializare GuardianBit pe Google Search...");
    
   
    const guardianStyles = document.createElement('style');
    guardianStyles.textContent = `
        [data-guardianbit-badge="true"] * {
            direction: ltr !important;
            unicode-bidi: isolate !important;
            text-align: left !important;
        }
    `;
    document.head.appendChild(guardianStyles);
    
    scanSearchResults();
    setupObserver();

    window.addEventListener("load", () => setTimeout(scanSearchResults, 1000));
    setTimeout(() => scanSearchResults(), 3000);
    setTimeout(() => scanSearchResults(), 5000);
}