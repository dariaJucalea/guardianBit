package com.guardianBit.guardianBit.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import java.io.File;
import java.time.Duration;

@Service
public class VirusTotalService {

    @Value("${virustotal.api.key}")
    private String apiKey;

    private static final String BASE_URL = "https://www.virustotal.com/api/v3";

    public boolean isHashMalicious(String hash, String filePath) {
        try {
            String response = WebClient.create().get()
                    .uri(BASE_URL + "/files/" + hash)
                    .header("x-apikey", apiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = new ObjectMapper().readTree(response);
            int maliciousCount = root.path("data").path("attributes")
                    .path("last_analysis_stats").path("malicious").asInt();

            return maliciousCount > 0;

        } catch (Exception e) {
            System.out.println("⚠️ Hash not found or error. Trying to upload file...");
            return uploadFileAndCheckMalicious(filePath);
        }
    }

    public boolean uploadFileAndCheckMalicious(String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                System.out.println("⚠️ Fișierul nu există.");
                return false;
            }

            WebClient uploadClient = WebClient.builder()
                    .baseUrl(BASE_URL)
                    .defaultHeader("x-apikey", apiKey)
                    .build();

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("file", new FileSystemResource(file));

            String uploadResponse = uploadClient.post()
                    .uri("/files")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(formData)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode uploadJson = new ObjectMapper().readTree(uploadResponse);
            String analysisId = uploadJson.path("data").path("id").asText();

            if (analysisId == null || analysisId.isBlank()) {
                System.out.println("⚠️ Nu s-a primit analysis ID.");
                return false;
            }

            System.out.println("📤 Fișierul a fost trimis. Analysis ID: " + analysisId);

            Thread.sleep(10000); // așteptăm să termine analiza

            String analysisResponse = uploadClient.get()
                    .uri("/analyses/" + analysisId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(15));

            JsonNode resultJson = new ObjectMapper().readTree(analysisResponse);
            JsonNode stats = resultJson.path("data").path("attributes").path("stats");
            int malicious = stats.path("malicious").asInt();

            return malicious > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
