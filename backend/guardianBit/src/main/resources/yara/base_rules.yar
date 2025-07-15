rule Is_JPG {
    strings: $magic = { FF D8 FF E0 }
    condition: $magic at 0
}

rule Is_PNG {
    strings: $magic = { 89 50 4E 47 }
    condition: $magic at 0
}

rule Is_PDF {
    strings: $magic = "%PDF"
    condition: $magic at 0
}

rule Is_EXE {
    strings: $magic = "MZ"
    condition: $magic at 0
}



rule Is_RAR {
    strings: $magic = { 52 61 72 21 1A 07 00 }
    condition: $magic at 0
}

rule Is_MP3 {
    strings: $magic = { 49 44 33 }
    condition: $magic at 0
}

rule Is_WAV {
    strings: $magic = { 52 49 46 46 ?? ?? ?? ?? 57 41 56 45 }
    condition: $magic at 0
}

rule Is_MP4 {
    strings: $magic = { 66 74 79 70 }
    condition: $magic at 4
}

rule Is_GIF {
    strings: $magic = { 47 49 46 38 39 61 }
    condition: $magic at 0
}

rule Is_BMP {
    strings: $magic = { 42 4D }
    condition: $magic at 0
}

rule Is_ISO {
    strings: $magic = { 43 44 30 30 31 }
    condition: $magic at 0
}

rule Is_ELF {
    strings: $magic = { 7F 45 4C 46 }
    condition: $magic at 0
}
rule Is_DOCX {
    strings:
        $zip = { 50 4B 03 04 }
        $docx_path = "word/document.xml"
    condition:
        $zip at 0 and $docx_path
}

rule Is_PPTX {
    strings:
        $zip = { 50 4B 03 04 }
        $pptx_path = "ppt/presentation.xml"
    condition:
        $zip at 0 and $pptx_path
}
rule Is_XLSX {
    strings:
        $zip = { 50 4B 03 04 }
        $xlsx_path = "xl/workbook.xml"
    condition:
        $zip at 0 and $xlsx_path
}

rule Is_RTF {
    strings: $magic = "{\\rtf"
    condition: $magic at 0
}

rule Is_HTML {
    strings:
        $doctype = "<!DOCTYPE html"
        $html_tag = "<html"
    condition:
        any of them
}

rule Is_DOC {
    strings: $magic = { D0 CF 11 E0 A1 B1 1A E1 } // old MS Office
    condition: $magic at 0
}
rule Is_7Z {
    strings:
        $magic = { 37 7A BC AF 27 1C }
    condition:
        $magic at 0
}

rule Is_TAR {
    strings:
        $ustar = "ustar"
    condition:
        $ustar at 257
}

rule Is_CAB {
    strings:
        $magic = "MSCF"
    condition:
        $magic at 0
}

rule Is_XLS {
    strings:
        $magic = { D0 CF 11 E0 A1 B1 1A E1 }
    condition:
        $magic at 0
}

rule Is_XML {
    strings:
        $xml = "<?xml"
    condition:
        $xml at 0
}

rule Is_JSON {
    strings:
        $json = "{"
    condition:
        $json at 0
}

rule Is_ODT {
    strings:
        $zip = { 50 4B 03 04 }
        $odt_path = "content.xml"
    condition:
        $zip at 0 and $odt_path
}

rule Is_JS {
    strings:
        $js1 = "function"
        $js2 = "var"
    condition:
        any of them
}

rule Is_PS1 {
    strings:
        $ps1 = "powershell"
        $ps2 = "Invoke-"
    condition:
        any of them
}

rule Is_BAT {
    strings:
        $bat1 = "@echo"
        $bat2 = "cmd.exe"
    condition:
        any of them
}

rule Is_CMD {
    strings:
        $cmd1 = "cmd /c"
    condition:
        $cmd1
}

rule Is_SVG {
    strings:
        $svg = "<svg"
    condition:
        $svg at 0
}

rule Is_ICO {
    strings:
        $ico = { 00 00 01 00 }
    condition:
        $ico at 0
}

rule Is_TTF {
    strings:
        $ttf = { 00 01 00 00 00 }
    condition:
        $ttf at 0
}

rule Is_VHD {
    strings:
        $vhd = "conectix"
    condition:
        $vhd
}

rule Is_IMG {
    strings:
        $img = "NTFS"
    condition:
        $img
}
rule Is_ZIP {
    strings: $magic = { 50 4B 03 04 }
    condition: $magic at 0
}