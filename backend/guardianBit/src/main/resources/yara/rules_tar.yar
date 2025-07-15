rule Detect_Suspicious_Embedded_Files_In_TAR {
    meta:
        description = "Detectează fișiere periculoase în arhive TAR"
        severity = "MEDIUM"
        category = "tar"
    strings:
        $exe = ".exe"
        $sh = ".sh"
        $ps1 = ".ps1"
    condition:
        any of them
}
