rule Detect_Suspicious_JS_In_HTML {
    meta:
        description = "Detectează cod JavaScript periculos în fișiere HTML"
        severity = "HIGH"
        category = "html"
    strings:
        $eval = /eval\(.*\)/
        $iframe = "<iframe"
        $script = "<script"
        $obf = "fromCharCode"
    condition:
        any of them
}

rule Detect_Payload_Links_In_HTML {
    meta:
        description = "Detectează link-uri către payload-uri sau fișiere malware"
        severity = "MEDIUM"
        category = "html"
    strings:
        $exe = ".exe"
        $zip = ".zip"
        $rar = ".rar"
    condition:
        any of them
}
