rule Detect_JS_In_SVG {
    meta:
        description = "Detectează JavaScript embed-uit în fișiere SVG"
        severity = "HIGH"
        category = "svg"
    strings:
        $script = "<script"
        $onload = "onload="
    condition:
        any of them
}
