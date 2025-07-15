rule Detect_Suspicious_JS {
    meta:
        description = "Detectează JavaScript periculos"
        severity = "HIGH"
        category = "js"
    strings:
        $eval = "eval("
        $document = "document.write"
        $fromCharCode = "String.fromCharCode"
    condition:
        any of them
}

rule Detect_Suspicious_PS1 {
    meta:
        description = "Detectează comenzi PowerShell periculoase"
        severity = "HIGH"
        category = "ps1"
    strings:
        $invoke = "Invoke-Expression"
        $iex = "IEX"
        $web = "DownloadString"
    condition:
        any of them
}

rule Detect_Suspicious_Batch {
    meta:
        description = "Detectează comenzi suspicioase în .bat/.cmd"
        severity = "HIGH"
        category = "bat"
    strings:
        $start = "start "
        $del = "del "
        $format = "format "
    condition:
        any of them
}
