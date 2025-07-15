rule Detect_Hidden_Data_In_PNG {
    meta:
        description = "Detectează date ascunse sau cod malitios în fișiere PNG"
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

rule Detect_Suspicious_URLs_In_PNG {
    meta:
        description = "Detectează URL-uri suspecte în fișiere PNG"
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

rule Detect_Obfuscated_Data_In_PNG {
    meta:
        description = "Detectează date ofuscate sau criptate în fișiere PNG"
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

rule Detect_Suspicious_Commands_In_PNG {
    meta:
        description = "Detectează comenzi suspecte în fișiere PNG"
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

rule Detect_Executable_Code_In_PNG {
    meta:
        description = "Detectează fragmente de cod executabil în fișiere PNG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "HIGH"

    strings:
        $elf_header = { 7F 45 4C 46 }  // Header ELF (executabile Linux)
        $pe_header = "MZ"  // Header PE (executabile Windows)
        $mach_o_header = { CE FA ED FE }  // Header Mach-O (executabile macOS)

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}

rule Detect_Suspicious_Metadata_In_PNG {
    meta:
        description = "Detectează metadate suspecte în fișiere PNG"
        author = "GuardianBit"
        date = "2023-10-01"
        severity = "MEDIUM"

    strings:
        $comment_keyword = /Comment/i  // Comentarii în metadate
        $software_keyword = /Software/i  // Software folosit pentru a crea fișierul
        $author_keyword = /Author/i  // Autorul fișierului
        $suspicious_keyword = /(malware|virus|exploit)/i  // Cuvinte cheie suspecte

    condition:
        any of them  // Dacă oricare dintre aceste șiruri este găsit, regula se declanșează
}