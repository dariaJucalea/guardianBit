rule Detect_Macros_In_XLS {
    meta:
        description = "Detectează macro-uri în fișiere XLS vechi"
        severity = "HIGH"
        category = "xls"
    strings:
        $macro1 = "VBA"
        $macro2 = "ThisWorkbook"
    condition:
        any of them
}
