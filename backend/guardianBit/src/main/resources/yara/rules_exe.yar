rule Detect_Shellcode_In_EXE {
    meta:
        description = "Detectează shellcode în fișiere EXE"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $shellcode = { 31 C0 50 68 2F 2F 73 68 68 2F 62 69 6E 89 E3 50 53 89 E1 B0 0B CD 80 }

    condition:
        $shellcode
}

rule Detect_Suspicious_API_Calls_In_EXE {
    meta:
        description = "Detectează apeluri la API-uri suspecte în fișiere EXE"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $create_process = "CreateProcess" nocase  // Crearea de procese
        $write_file = "WriteFile" nocase  // Scrierea de fișiere
        $reg_set_value = "RegSetValue" nocase  // Modificarea registrilor
        $internet_open = "InternetOpen" nocase  // Accesul la rețea

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Obfuscation_In_EXE {
    meta:
        description = "Detectează obfuscare sau criptare în fișiere EXE"
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

rule Detect_Suspicious_URLs_In_EXE {
    meta:
        description = "Detectează URL-uri suspecte în fișiere EXE"
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

rule Detect_Ransomware_Behavior_In_EXE {
    meta:
        description = "Detectează comportamente de ransomware în fișiere EXE"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $ransom_note = /(pay|bitcoin|ransom|decrypt)/i  // Note de ransoms
        $encryption_keywords = /(AES|RSA|encrypt)/i  // Cuvinte cheie legate de criptare
        $file_extension_change = /\.(encrypted|locked)/i  // Schimbarea extensiilor fișierelor

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Packers_In_EXE {
    meta:
        description = "Detectează packere sau compilatoare suspecte în fișiere EXE"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $upx_header = "UPX!"  // Header UPX
        $aspack_header = "ASPack"  // Header ASPack
        $fsg_header = "FSG!"  // Header FSG

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Code_Injection_In_EXE {
    meta:
        description = "Detectează injectare de cod în alte procese în fișiere EXE"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $write_process_memory = "WriteProcessMemory" nocase  // Scrierea în memoria altui proces
        $create_remote_thread = "CreateRemoteThread" nocase  // Crearea de fire de execuție în alte procese
        $virtual_alloc_ex = "VirtualAllocEx" nocase  // Alocarea de memorie în alte procese

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}