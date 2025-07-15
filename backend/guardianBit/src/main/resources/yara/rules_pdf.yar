rule Detect_JavaScript_In_PDF {
    meta:
        description = "Detectează cod JavaScript în fișiere PDF"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $js_keyword = /\/JS\b/  // Referință la obiectul JavaScript
        $script_tag = /\/JavaScript\b/  // Referință la JavaScript
        $eval_function = /\/eval\b/  // Funcția eval()
        $open_action = /\/OpenAction\b/  // Acțiuni automate la deschidere

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_Objects_In_PDF {
    meta:
        description = "Detectează obiecte sau fluxuri suspecte în fișiere PDF"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $obj_keyword = /\d+\s+\d+\s+obj/  // Declarații de obiecte PDF
        $stream_keyword = /stream[\r\n]/  // Începutul unui flux de date
        $endstream_keyword = /endstream/  // Sfârșitul unui flux de date
        $encoded_data = /\/Filter\s*\/[A-Za-z]+/  // Date codate (ex: FlateDecode, ASCIIHex)

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Automatic_Actions_In_PDF {
    meta:
        description = "Detectează acțiuni automate suspecte în fișiere PDF"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $open_action = /\/OpenAction\b/  // Acțiuni la deschidere
        $launch_action = /\/Launch\b/  // Lansarea de aplicații externe
        $uri_action = /\/URI\b/  // Link-uri externe
        $javascript_action = /\/AA\b/  // Acțiuni JavaScript

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_URLs_In_PDF {
    meta:
        description = "Detectează URL-uri suspecte în fișiere PDF"
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

rule Detect_Obfuscated_Data_In_PDF {
    meta:
        description = "Detectează date ofuscate sau criptate în fișiere PDF"
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

rule Detect_Suspicious_Commands_In_PDF {
    meta:
        description = "Detectează comenzi suspecte în fișiere PDF"
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

