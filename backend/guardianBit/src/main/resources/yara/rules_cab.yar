rule Detect_Malicious_Content_In_CAB {
    meta:
        description = "Detectează executabile sau DLL-uri embed-uite în fișiere CAB"
        severity = "HIGH"
        category = "cab"
    strings:
        $mz = "MZ"
        $dll = ".dll"
    condition:
        any of them
}
