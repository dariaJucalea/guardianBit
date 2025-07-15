package com.guardianBit.guardianBit.controllers;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/js")
@CrossOrigin(origins = "*")
public class JsAnalysisController {

    private static final String FLASK_JS_ENDPOINT = "http://localhost:5002/predict";

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeJs(@RequestParam("file") MultipartFile file) {
        try {


            System.out.println("Am inceput scanarea scriptului!");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);


            ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return "script.js";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileAsResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);


            RestTemplate restTemplate = new RestTemplate();
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(
                        FLASK_JS_ENDPOINT,
                        requestEntity,
                        Map.class
                );
                return ResponseEntity.ok(response.getBody());
            } catch (RestClientException e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to connect to Flask server");
                errorResponse.put("details", e.getMessage());
                errorResponse.put("endpoint", FLASK_JS_ENDPOINT);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error processing JS file", "details", e.getMessage()));
        }
    }
}