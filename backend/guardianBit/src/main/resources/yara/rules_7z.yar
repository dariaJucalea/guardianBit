rule Detect_Executable_In_7Z {
    meta:
        description = "Detectează executabile în arhive 7z"
        severity = "HIGH"
        category = "7z"
    strings:
        $mz = "MZ"
        $exe = ".exe"
        $dll = ".dll"
    condition:
        any of them
}
