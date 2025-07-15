package com.guardianBit.guardianBit.controllers;

import com.guardianBit.guardianBit.models.ReportedUrl;
import com.guardianBit.guardianBit.repositories.ReportedUrlRepository;
import com.guardianBit.guardianBit.services.ReportedUrlService;
import com.guardianBit.guardianBit.services.UrlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import com.guardianBit.guardianBit.models.MaliciousUrl;
import com.guardianBit.guardianBit.repositories.MaliciousUrlRepository;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UrlController {

    private final UrlService urlService;
    private final MaliciousUrlRepository maliciousUrlRepository;
    private final ReportedUrlService reportedUrlService;
    private final ReportedUrlRepository reportedUrlRepository;

    // Simple in-memory cache
    private final ConcurrentHashMap<String, Map<String, Object>> simpleCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> inProgress = new ConcurrentHashMap<>();
    private final long CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private final long DUPLICATE_WINDOW = 3 * 1000; // 3 seconds

    public UrlController(UrlService urlService, MaliciousUrlRepository maliciousUrlRepository,
                         ReportedUrlService reportedUrlService, ReportedUrlRepository reportedUrlRepository) {
        this.urlService = urlService;
        this.maliciousUrlRepository = maliciousUrlRepository;
        this.reportedUrlService = reportedUrlService;
        this.reportedUrlRepository = reportedUrlRepository;
    }

    @PostMapping("/url")
    public Mono<ResponseEntity<Map<String, Object>>> handleUrl(@RequestBody Map<String, String> request) {
        String url = request.get("url");

        if (url == null || url.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "URL is required")));
        }

        // Normalize URL
        String normalizedUrl = normalizeUrl(url);

        // Check simple cache first
        Map<String, Object> cached = getFromCache(normalizedUrl);
        if (cached != null) {
            System.out.println("📋 Cache hit for: " + normalizedUrl);
            return Mono.just(ResponseEntity.ok(cached));
        }

        // Check if URL is being processed right now
        long currentTime = System.currentTimeMillis();
        Long startTime = inProgress.get(normalizedUrl);
        if (startTime != null && currentTime - startTime < DUPLICATE_WINDOW) {
            // Return a simple message for duplicate requests
            return Mono.just(ResponseEntity.ok(Map.of(
                    "url", url,
                    "message", "Request is being processed",
                    "status", "processing"
            )));
        }

        // Mark as in progress
        inProgress.put(normalizedUrl, currentTime);

        // Process normally
        String domain = url.replaceAll("https?://", "").split("/")[0];

        return Mono.zip(
                urlService.processUrl(url),
                urlService.checkWithAlienVault(domain),
                urlService.calculateRiskScore(url)
        ).map(tuple -> {
            Map<String, Object> mlResponse = tuple.getT1();
            boolean isMaliciousAlienVault = tuple.getT2();
            int riskScore = tuple.getT3();

            Map<String, Object> response = new HashMap<>();
            response.put("url", url);
            response.put("ml_prediction", mlResponse.get("predictions"));
            response.put("alienvault_reported", isMaliciousAlienVault);
            response.put("risk_score", riskScore);
            response.put("final_decision", riskScore > 49 ? "MALICIOUS" : "SAFE");

            // Save to cache
            putInCache(normalizedUrl, response);

            // Remove from in-progress
            inProgress.remove(normalizedUrl);

            if (riskScore > 49) {
                Optional<MaliciousUrl> existingUrl = maliciousUrlRepository.findByUrl(url);
                if (existingUrl.isEmpty()) {
                    maliciousUrlRepository.save(new MaliciousUrl(url, riskScore, true));
                } else {
                    System.out.println("🔴 URL-ul deja există în baza de date: " + url);
                }
            }

            return ResponseEntity.ok(response);
        }).doOnError(error -> {
            // Remove from in-progress on error
            inProgress.remove(normalizedUrl);
        });
    }

    private String normalizeUrl(String url) {
        try {
            URI uri = new URI(url);
            return uri.getScheme() + "://" + uri.getHost().toLowerCase();
        } catch (URISyntaxException e) {
            return url.toLowerCase();
        }
    }

    private Map<String, Object> getFromCache(String url) {
        Long timestamp = cacheTimestamps.get(url);
        if (timestamp != null && System.currentTimeMillis() - timestamp < CACHE_DURATION) {
            return simpleCache.get(url);
        }

        // Remove expired entry
        if (timestamp != null) {
            simpleCache.remove(url);
            cacheTimestamps.remove(url);
        }
        return null;
    }

    private void putInCache(String url, Map<String, Object> response) {
        simpleCache.put(url, response);
        cacheTimestamps.put(url, System.currentTimeMillis());

        // Simple cleanup - remove old entries when cache gets too big
        if (simpleCache.size() > 100) {
            cleanupCache();
        }
    }

    private void cleanupCache() {
        long currentTime = System.currentTimeMillis();
        cacheTimestamps.entrySet().removeIf(entry -> {
            if (currentTime - entry.getValue() > CACHE_DURATION) {
                simpleCache.remove(entry.getKey());
                return true;
            }
            return false;
        });
    }

    // Rest of your methods remain unchanged
    @PostMapping("/report")
    public ResponseEntity<String> reportMaliciousUrl(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        String email = request.get("email");

        if (url == null || url.isEmpty() || email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("URL-ul și email-ul sunt necesare.");
        }

        try {
            URI uri = new URI(url);
            String normalizedUrl = uri.getScheme() + "://" + uri.getHost();


            ReportedUrl report = new ReportedUrl(normalizedUrl, email);
            reportedUrlRepository.save(report);


            List<ReportedUrl> reports = reportedUrlService.getReportsByUrl(normalizedUrl);
            if (reports.size() >= 5) {
                Optional<MaliciousUrl> existing = maliciousUrlRepository.findByUrl(normalizedUrl);
                if (existing.isEmpty()) {
                    MaliciousUrl maliciousUrl = new MaliciousUrl(normalizedUrl, 50, true); // Presupunem un scor minim
                    maliciousUrlRepository.save(maliciousUrl);
                    System.out.println("🚨 URL raportat de ≥ 5 ori. Adăugat ca malițios: " + normalizedUrl);
                }


                reportedUrlService.deleteReportsByUrl(normalizedUrl);
            }

            return ResponseEntity.ok("Site raportat cu succes.");
        } catch (URISyntaxException e) {
            return ResponseEntity.badRequest().body("URL invalid.");
        }
    }


    @GetMapping("/report/history")
    public ResponseEntity<List<ReportedUrl>> getUserReports(@RequestParam String email) {
        return ResponseEntity.ok(reportedUrlService.getReportsByEmail(email));
    }

    @GetMapping("/stats/top-malicious")
    public ResponseEntity<List<String>> getTopMaliciousDomains() {
        List<String> top = urlService.getTopMaliciousDomains(4);
        return ResponseEntity.ok(top);
    }
}