rule Detect_Executable_In_IMG {
    meta:
        description = "Detectează executabile în fișiere IMG (imagini de disc)"
        severity = "HIGH"
        category = "img"
    strings:
        $mz = "MZ"
        $pe = "This program cannot be run"
    condition:
        any of them
}
