rule Detect_Macro_Keyword_In_DOCX {
    meta:
        description = "Detectează macro-uri potențiale în fișiere DOCX"
        severity = "HIGH"
        category = "docx"
    strings:
        $macro1 = "vbaProject.bin"
        $macro2 = "Macros/Project"
        $macro3 = "ThisDocument"
    condition:
        any of them
}

rule Detect_Suspicious_URLs_In_DOCX {
    meta:
        description = "Detectează URL-uri suspecte în DOCX"
        severity = "MEDIUM"
        category = "docx"
    strings:
        $http_url = /http:\/\/[^\s]+/
        $https_url = /https:\/\/[^\s]+/
        $ip = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
    condition:
        any of them
}

rule Detect_Embedded_Executable_In_DOCX {
    meta:
        description = "Detectează executabile sau scripturi inserate în DOCX"
        severity = "HIGH"
        category = "docx"
    strings:
        $exe = "MZ"
        $bat = ".bat"
        $ps = ".ps1"
        $cmd = ".cmd"
    condition:
        any of them
}
