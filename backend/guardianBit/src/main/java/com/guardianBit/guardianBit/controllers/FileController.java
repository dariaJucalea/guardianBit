package com.guardianBit.guardianBit.controllers;

import com.guardianBit.guardianBit.services.FileService;
import com.guardianBit.guardianBit.dto.FileScanRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;



@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(value = "/scan-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> scanFile(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            File tempFile = File.createTempFile("upload-", file.getOriginalFilename());
            file.transferTo(tempFile);

            System.out.println("📁 Am primit fisier: " + tempFile.getAbsolutePath());
            String hash;
            try {
                hash = calculeazaSHA256(tempFile);
            } catch (NoSuchAlgorithmException e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body(Map.of("error", "Algoritm SHA-256 indisponibil."));
            }

            Map<String, Object> scanResult = fileService.scanFile(hash, tempFile.getAbsolutePath());
            return ResponseEntity.ok(scanResult);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Eroare la procesarea fișierului."));
        }
    }


    public String calculeazaSHA256(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream is = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }
        byte[] hashBytes = digest.digest();
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }


}
