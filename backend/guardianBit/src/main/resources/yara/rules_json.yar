rule Detect_Encoded_Data_In_JSON {
    meta:
        description = "Detectează date codate (Base64, hex) în fișiere JSON"
        severity = "MEDIUM"
        category = "json"
    strings:
        $base64 = /[A-Za-z0-9+\\/]{20,}={0,2}/
        $hex = /[A-Fa-f0-9]{32,}/
    condition:
        any of them
}
