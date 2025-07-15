package com.guardianBit.guardianBit.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.File;
import java.time.Duration;
import java.util.Map;

@Service
public class HybridAnalysisService {

    private static final String API_KEY = "rzk17rjp060ad264gu4nz42c00ebeb19qo6597r9af522c9fhpzth1hc9b4dd2f2";
    private static final String BASE_URL = "https://www.hybrid-analysis.com/api/v2";

    private final WebClient webClient;

    public HybridAnalysisService() {
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("api-key", API_KEY)
                .build();
    }

    public String submitFile(String filePath) {
        try {
            File file = new File(filePath);
            FileSystemResource resource = new FileSystemResource(file);

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", resource);
            builder.part("environment_id", "100");

            String response = webClient.post()
                    .uri("/submit/file")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build())) // <-- folosim builder
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode json = new ObjectMapper().readTree(response);
            return json.path("job_id").asText();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean isFileMaliciousByHash(String sha256) {
        try {
            String response = webClient.get()
                    .uri("/overview/" + sha256)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(10));

            JsonNode json = new ObjectMapper().readTree(response);

            String verdict = json.path("verdict").asText(); // Ex: "no specific threat"
            int threatScore = json.has("threat_score") && !json.get("threat_score").isNull()
                    ? json.get("threat_score").asInt()
                    : -1;

            System.out.println("🛡 Verdict de la Hybrid Analysis: " + verdict);
            System.out.println("🔢 Threat Score: " + threatScore);

            return "malicious".equalsIgnoreCase(verdict)
                    || "suspicious".equalsIgnoreCase(verdict)
                    || threatScore >= 85;

        } catch (Exception e) {
            System.err.println("❌ Eroare la obținerea overview: " + e.getMessage());
            return false;
        }
    }




}

