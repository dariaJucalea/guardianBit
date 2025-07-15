rule Detect_Hidden_Executable_In_JPG {
    meta:
        description = "Detectează cod executabil sau scripturi ascunse în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $shellcode = { 31 C0 50 68 2F 2F 73 68 68 2F 62 69 6E 89 E3 50 53 89 E1 B0 0B CD 80 }  // Shellcode comun
        $powershell = "powershell.exe" nocase  // Apeluri la PowerShell
        $bash_script = "#!/bin/bash" nocase   // Scripturi Bash
        $base64_data = /[A-Za-z0-9+\/]{20,}={0,2}/  // Date codate în Base64

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_URLs_In_JPG {
    meta:
        description = "Detectează URL-uri suspecte în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "MEDIUM"

    strings:
        $http_url = /http:\/\/[^\s]+/  // URL-uri HTTP
        $https_url = /https:\/\/[^\s]+/  // URL-uri HTTPS
        $ip_address = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/  // Adrese IP

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Obfuscated_Data_In_JPG {
    meta:
        description = "Detectează date ofuscate sau criptate în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $hex_pattern = /[0-9A-Fa-f]{32,}/  // Șiruri hexazecimale lungi
        $base64_pattern = /[A-Za-z0-9+\/]{20,}={0,2}/  // Date codate în Base64
        $xor_pattern = /\x00\xFF|\xFF\x00/  // Modele XOR comune

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_Commands_In_JPG {
    meta:
        description = "Detectează comenzi suspecte în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $cmd_command = /cmd\.exe\s+\/c/ nocase  // Comenzi CMD
        $powershell_command = /powershell\.exe\s+-[eE]/ nocase  // Comenzi PowerShell
        $bash_command = /bash\s+-c/ nocase  // Comenzi Bash
        $wget_command = /wget\s+http/ nocase  // Comenzi wget
        $curl_command = /curl\s+http/ nocase  // Comenzi curl

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_Commands_In_JPG {
    meta:
        description = "Detectează comenzi suspecte în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $cmd_command = /cmd\.exe\s+\/c/ nocase  // Comenzi CMD
        $powershell_command = /powershell\.exe\s+-[eE]/ nocase  // Comenzi PowerShell
        $bash_command = /bash\s+-c/ nocase  // Comenzi Bash
        $wget_command = /wget\s+http/ nocase  // Comenzi wget
        $curl_command = /curl\s+http/ nocase  // Comenzi curl

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_JavaScript_In_JPG {
    meta:
        description = "Detectează cod JavaScript în fișiere JPG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $javascript_function = /function\s+\w+\s*\(/  // Funcții JavaScript
        $script_tag = /<script\b[^>]*>/ nocase  // Tag-uri <script>
        $eval_function = /eval\s*\(/ nocase  // Funcția eval()

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}
