rule Detect_Scripts_In_ODF {
    meta:
        description = "Detectează scripturi sau obiecte în fișiere LibreOffice (ODT, ODS, ODP)"
        severity = "HIGH"
        category = "odf"
    strings:
        $macro = "Basic"
        $script = "<script"
    condition:
        any of them
}
