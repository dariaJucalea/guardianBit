rule Detect_Macro_In_DOC {
    meta:
        description = "Detectează macro-uri în fișiere DOC binare"
        severity = "HIGH"
        category = "doc"
    strings:
        $vba1 = "VBA"
        $project = "Project"
        $thisdoc = "ThisDocument"
    condition:
        any of them
}

rule Detect_Embedded_Executable_In_DOC {
    meta:
        description = "Detectează executabile embed-uite în DOC"
        severity = "HIGH"
        category = "doc"
    strings:
        $exe = "MZ"
        $bat = ".bat"
        $scr = ".scr"
    condition:
        any of them
}
