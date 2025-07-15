rule Detect_Suspicious_Macros_In_PPTX {
    meta:
        description = "Detectează macro-uri potențiale în fișiere PPTX"
        severity = "HIGH"
        category = "pptx"
    strings:
        $macro1 = "vbaProject.bin"
        $macro2 = "Macros"
    condition:
        any of them
}

rule Detect_URLs_In_PPTX {
    meta:
        description = "Detectează URL-uri embed-uite în PPTX"
        severity = "MEDIUM"
        category = "pptx"
    strings:
        $http = /http:\/\/[^\s]+/
        $https = /https:\/\/[^\s]+/
        $ip = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
    condition:
        any of them
}

rule Detect_Embedded_Executables_In_PPTX {
    meta:
        description = "Detectează fișiere executabile embed-uite în PPTX"
        severity = "HIGH"
        category = "pptx"
    strings:
        $mz = "MZ"
        $scr = ".scr"
        $cmd = ".cmd"
    condition:
        any of them
}
