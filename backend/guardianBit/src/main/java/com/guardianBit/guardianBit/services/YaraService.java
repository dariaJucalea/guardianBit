package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.dto.YaraScanResult;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class YaraService {

    private static final String YARA_EXECUTABLE = "C:\\Users\\Daria\\OneDrive\\Desktop\\yara-v4.5.2-2326-win64\\yara64.exe";
    private static final String BASE_RULES_PATH = "yara/base_rules.yar";

    private static final Map<String, String> FILE_TYPE_RULES = new HashMap<>();


    static {
        FILE_TYPE_RULES.put("jpg", "yara/rules_jpg.yar");
        FILE_TYPE_RULES.put("png", "yara/rules_png.yar");
        FILE_TYPE_RULES.put("pdf", "yara/rules_pdf.yar");
        FILE_TYPE_RULES.put("exe", "yara/rules_exe.yar");
        FILE_TYPE_RULES.put("zip", "yara/rules_zip.yar");
        FILE_TYPE_RULES.put("rar", "yara/rules_rar.yar");
        FILE_TYPE_RULES.put("mp3", "yara/rules_mp3.yar");
        FILE_TYPE_RULES.put("mp4", "yara/rules_mp4.yar");
        FILE_TYPE_RULES.put("wav", "yara/rules_wav.yar");
        FILE_TYPE_RULES.put("iso", "yara/rules_iso.yar");
        FILE_TYPE_RULES.put("docx", "yara/rules_docx.yar");
        FILE_TYPE_RULES.put("pptx", "yara/rules_pptx.yar");
        FILE_TYPE_RULES.put("xlsx", "yara/rules_xlsx.yar");
        FILE_TYPE_RULES.put("doc", "yara/rules_doc.yar");
        FILE_TYPE_RULES.put("html", "yara/rules_html.yar");
        FILE_TYPE_RULES.put("rtf", "yara/rules_rtf.yar");
        FILE_TYPE_RULES.put("7z", "yara/rules_7z.yar");
        FILE_TYPE_RULES.put("tar", "yara/rules_tar.yar");
        FILE_TYPE_RULES.put("cab", "yara/rules_cab.yar");
        FILE_TYPE_RULES.put("xls", "yara/rules_xls.yar");
        FILE_TYPE_RULES.put("xml", "yara/rules_xml.yar");
        FILE_TYPE_RULES.put("json", "yara/rules_json.yar");
        FILE_TYPE_RULES.put("odt", "yara/rules_odf.yar");
        FILE_TYPE_RULES.put("ods", "yara/rules_odf.yar");
        FILE_TYPE_RULES.put("odp", "yara/rules_odf.yar");
        FILE_TYPE_RULES.put("js", "yara/rules_scripts.yar");
        FILE_TYPE_RULES.put("ps1", "yara/rules_scripts.yar");
        FILE_TYPE_RULES.put("bat", "yara/rules_scripts.yar");
        FILE_TYPE_RULES.put("cmd", "yara/rules_scripts.yar");
        FILE_TYPE_RULES.put("svg", "yara/rules_svg.yar");
        FILE_TYPE_RULES.put("ico", "yara/rules_ico.yar");
        FILE_TYPE_RULES.put("ttf", "yara/rules_ttf.yar");
        FILE_TYPE_RULES.put("vhd", "yara/rules_vhd.yar");
        FILE_TYPE_RULES.put("img", "yara/rules_img.yar");

    }

    public YaraScanResult scanFileWithYara(String filePath) {
        try {
            File baseRulesFile = new ClassPathResource(BASE_RULES_PATH).getFile();

            ProcessBuilder baseScanProcessBuilder = new ProcessBuilder(
                    YARA_EXECUTABLE, baseRulesFile.getAbsolutePath(), filePath
            );
            Process baseProcess = baseScanProcessBuilder.start();
            baseProcess.waitFor();

            String fileExtension = getFileExtension(filePath);
            String detectedType = detectFileType(baseProcess);

            System.out.println("📝 Extensie declarată: " + fileExtension);
            System.out.println("🔎 Tip detectat de YARA: " + detectedType);


            if (detectedType == null) {
                return new YaraScanResult(true, "Nu s-a putut detecta tipul fișierului!");
            }

            if (!fileExtension.equals(detectedType)) {
                return new YaraScanResult(true, "Extensia declarata este diferita de cea reala.");
            }

            String specificRulePath = FILE_TYPE_RULES.get(detectedType);
            if (specificRulePath == null) {
                return new YaraScanResult(false, null); // curat
            }

            File specificRulesFile = new ClassPathResource(specificRulePath).getFile();

            ProcessBuilder specificScanProcessBuilder = new ProcessBuilder(
                    YARA_EXECUTABLE, specificRulesFile.getAbsolutePath(), filePath
            );
            Process specificProcess = specificScanProcessBuilder.start();
            specificProcess.waitFor();

            if (specificProcess.exitValue() != 0) {
                return new YaraScanResult(true, "Contine apeluri ale unor functii suspecte.");
            }

            return new YaraScanResult(false, null);

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return new YaraScanResult(false, "Eroare internă YARA.");
        }
    }



    private String getFileExtension(String filePath) {
        String name = new File(filePath).getName();
        int lastDot = name.lastIndexOf(".");
        if (lastDot != -1 && lastDot < name.length() - 1) {
            return name.substring(lastDot + 1).toLowerCase();
        }
        return "";
    }


    private String detectFileType(Process process) {
        try {
            Scanner scanner = new Scanner(process.getInputStream()).useDelimiter("\\A");
            String output = scanner.hasNext() ? scanner.next() : "";

            Pattern pattern = Pattern.compile("Is_(\\w+)");
            Matcher matcher = pattern.matcher(output);

            if (matcher.find()) {
                return matcher.group(1).toLowerCase(); // ex: "png"
            } else {
                System.out.println("❌ Nu s-a detectat niciun tip de fișier.");
                return null;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}
