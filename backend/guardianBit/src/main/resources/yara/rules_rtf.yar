rule Detect_Object_Embedding_In_RTF {
    meta:
        description = "Detectează obiecte OLE embed-uite în RTF"
        severity = "HIGH"
        category = "rtf"
    strings:
        $obj = "{\\object"
        $objdata = "{\\objdata"
    condition:
        any of them
}

rule Detect_Suspicious_RTF_Keywords {
    meta:
        description = "Detectează cuvinte cheie asociate cu exploituri în RTF"
        severity = "HIGH"
        category = "rtf"
    strings:
        $shell = "Shell.Application"
        $mshta = "mshta"
        $cmd = "cmd.exe"
    condition:
        any of them
}
