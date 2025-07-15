rule Detect_Suspicious_URLs_In_ZIP {
    meta:
        description = "Detectează URL-uri suspecte în arhive ZIP"
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

rule Detect_Obfuscated_Data_In_ZIP {
    meta:
        description = "Detectează date ofuscate sau criptate în arhive ZIP"
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

rule Detect_Nested_Archives_In_ZIP {
    meta:
        description = "Detectează arhive imbricate suspecte în arhive ZIP"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "MEDIUM"

    strings:
        $zip_header = "PK"  // Header ZIP
        $rar_header = "Rar!"  // Header RAR

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_Config_Files_In_ZIP {
    meta:
        description = "Detectează fișiere de configurare suspecte în arhive ZIP"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "MEDIUM"

    strings:
        $xml_tag = /<\?xml\b/  // Tag-uri XML
        $json_tag = /\{.*\}/  // Tag-uri JSON
        $suspicious_keyword = /(malware|virus|exploit)/i  // Cuvinte cheie suspecte

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_System_Files_In_ZIP {
    meta:
        description = "Detectează fișiere de sistem suspecte în arhive ZIP"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $dll_header = "MZ"  // Header DLL
        $sys_header = "MZ"  // Header SYS

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}