

console.log('🛡️ DLP Engine loading...');

const DLP_PATTERNS = {
  
  cnp: /\b[1-8]\d{12}\b/g,
  
  
  phone: /\b(?:\+4|0)?07\d{8}\b/g,
  

  email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}\b/gi,
  
 
  iban: /\bRO\d{2}[A-Z]{4}\d{16}\b/gi,
  

  card: /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14})\b/g,
  
 
  ci: /\b[A-Z]{2,3}\d{6}\b/gi,
  

  passport: /\b\d{8,9}\b/g
};


function testPatterns() {
    const testTexts = {
        cnp: "1234567890123 5678901234567",
        phone: "0712345678 +40712345678 0712 345 678",
        email: "test@example.com user.name+tag@domain.co.uk",
        iban: "RO49AAAA1B31007593840000",
        card: "4111111111111111 5105105105105100",
        ci: "AB123456 XYZ987654",
        passport: "12345678 123456789"
    };

    console.log('🧪 Testez pattern-urile DLP...');
    
    for (const [type, testText] of Object.entries(testTexts)) {
        const pattern = DLP_PATTERNS[type];
        const matches = testText.match(pattern);
        console.log(`${type}: pattern=${pattern} matches=`, matches);
    }
}

function scanTextForSensitiveData(text) {
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ Text invalid pentru scanare DLP');
        return {};
    }

    console.log(`🔍 Scanez text de ${text.length} caractere...`);
    
    const results = {};
    let totalMatches = 0;

    for (const [key, regex] of Object.entries(DLP_PATTERNS)) {
        try {
            const matches = text.match(regex);
            if (matches && matches.length > 0) {
                results[key] = matches;
                totalMatches += matches.length;
                console.log(`✅ ${key}: găsite ${matches.length} potriviri:`, matches);
            }
        } catch (error) {
            console.error(`❌ Eroare la scanarea ${key}:`, error);
        }
    }

    console.log(`📊 Total detecții DLP: ${totalMatches} în ${Object.keys(results).length} categorii`);
    
    return results;
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('📨 DLP Engine: Mesaj primit:', msg);

    if (msg.action === 'scanTextDLP') {
        try {
            const results = scanTextForSensitiveData(msg.text || '');
            console.log('📤 DLP Engine: Trimit răspuns:', { found: results });
            sendResponse({ found: results });
        } catch (error) {
            console.error('❌ Eroare în DLP Engine:', error);
            sendResponse({ found: {}, error: error.message });
        }
        return true; 
    }

    if (msg.action === 'testDLPPatterns') {
        testPatterns();
        sendResponse({ status: 'test complete' });
        return true;
    }
});


testPatterns();

console.log('✅ DLP Engine loaded successfully');