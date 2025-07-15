rule Detect_Suspicious_XML_Content {
    meta:
        description = "Detectează tag-uri sau structuri XML periculoase"
        severity = "MEDIUM"
        category = "xml"
    strings:
        $url = /http[s]?:\\/\\/[a-zA-Z0-9\\./_-]+/
        $script = "<script"
        $eval = "eval("
    condition:
        any of them
}
