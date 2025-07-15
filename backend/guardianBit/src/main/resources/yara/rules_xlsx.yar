rule Detect_Suspicious_Formula_In_XLSX {
    meta:
        description = "Detectează formule potențial periculoase în fișiere XLSX"
        severity = "HIGH"
        category = "xlsx"
    strings:
        $cmd = "=CMD"
        $powershell = "=powershell"
        $macro = "=VBA"
    condition:
        any of them
}

rule Detect_External_Links_In_XLSX {
    meta:
        description = "Detectează link-uri externe în XLSX"
        severity = "MEDIUM"
        category = "xlsx"
    strings:
        $http = /http:\/\/[^\s]+/
        $https = /https:\/\/[^\s]+/
    condition:
        any of them
}
