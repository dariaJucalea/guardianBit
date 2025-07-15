rule Detect_Malicious_Content_In_VHD {
    meta:
        description = "Detectează semnături malițioase în imagini VHD"
        severity = "HIGH"
        category = "vhd"
    strings:
        $exe = "MZ"
        $ps = "powershell"
        $cmd = "cmd.exe"
    condition:
        any of them
}
