rule Detect_Exploit_Font_TTF {
    meta:
        description = "Detectează fonturi TTF modificate pentru exploit"
        severity = "HIGH"
        category = "ttf"
    strings:
        $ttf = { 00 01 00 00 00 }
        $exploit = "CFF "  // PostScript embedded, folosit în unele CVE-uri
    condition:
        any of them
}
