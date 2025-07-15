rule Detect_Embedded_Payload_In_ICO {
    meta:
        description = "Detectează date suspecte embed-uite în fișiere ICO"
        severity = "MEDIUM"
        category = "ico"
    strings:
        $mz = "MZ"
        $hex = /[A-Fa-f0-9]{32,}/
    condition:
        any of them
}
