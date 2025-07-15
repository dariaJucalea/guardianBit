package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.repositories.MaliciousUrlRepository;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;

import com.guardianBit.guardianBit.models.*;

import java.util.*;
import java.util.concurrent.TimeUnit;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Service
public class UrlService {


    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private final WebClient mlWebClient;
    private final WebClient alienVaultWebClient;
    private final MaliciousUrlRepository maliciousUrlRepository;

    private static final String ALIENVAULT_API_URL = "https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general";
    private static final String IBM_XFORCE_API_KEY = "your-ibm-xforce-api-key";
    private static final String SHODAN_API_KEY = "your-shodan-api-key";
    private static final String PHISHTANK_API_KEY = "your-phishtank-api-key";
    private static final String URLHAUS_API_KEY = "your-urlhaus-api-key";

    public UrlService(WebClient.Builder webClientBuilder,MaliciousUrlRepository maliciousUrlRepository) {
        this.mlWebClient = webClientBuilder.baseUrl("http://localhost:5001").build();
        this.alienVaultWebClient = webClientBuilder.baseUrl("https://otx.alienvault.com").build();
        this.maliciousUrlRepository=maliciousUrlRepository;
    }

    public String extractDomain(String url) {
        try {

            java.net.URL urlObj = new java.net.URL(url);
            return urlObj.getHost();
        } catch (Exception e) {
            System.err.println("❌ Eroare la extragerea domeniului: " + e.getMessage());
            return null;
        }
    }

    public String getIpFromDomain(String domain) {
        try {
            WebClient webClient = WebClient.create("https://dns.google");
            Map<String, Object> response = webClient.get()
                    .uri("/resolve?name={domain}", domain)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (response != null && response.containsKey("Answer")) {
                List<Map<String, Object>> answers = (List<Map<String, Object>>) response.get("Answer");
                for (Map<String, Object> answer : answers) {
                    if (answer.containsKey("data")) {
                        return answer.get("data").toString();
                    }
                }
            }
            System.err.println("❌ Nu s-a putut obține IP-ul pentru domeniul: " + domain);
            return null;
        } catch (Exception e) {
            System.err.println("❌ Eroare la obținerea IP-ului: " + e.getMessage());
            return null;
        }
    }

    public Mono<Boolean> checkWithIbmXForce(String domain) {
        return WebClient.create("https://api.xforce.ibmcloud.com/url/" + domain)
                .get()
                .header("Authorization", "Basic " + IBM_XFORCE_API_KEY)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> response.containsKey("score") && (int) response.get("score") > 5)
                .onErrorReturn(false);
    }

    public Mono<Boolean> checkWithShodan(String ip) {
        return WebClient.create("https://api.shodan.io/shodan/host/" + ip + "?key=" + SHODAN_API_KEY)
                .get()
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> response.containsKey("vulns")) // Dacă există vulnerabilități detectate
                .onErrorReturn(false);
    }

    public Mono<Boolean> checkWithPhishTank(String url) {
        return WebClient.create("https://checkurl.phishtank.com/checkurl/")
                .post()
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("format=json&app_key=" + PHISHTANK_API_KEY + "&url=" + url)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> response.containsKey("results") && (boolean) ((Map<String, Object>) response.get("results")).get("valid"))
                .onErrorReturn(false);
    }

    public Mono<Boolean> checkWithUrlhaus(String url) {
        return WebClient.create("https://urlhaus-api.abuse.ch/v1/url/")
                .post()
                .header("Content-Type", "application/json")
                .bodyValue(Map.of("url", url))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> response.containsKey("query_status") && "malicious".equals(response.get("query_status")))
                .onErrorReturn(false);
    }

    public Mono<Map<String, Object>> processUrl(String url) {
        return mlWebClient.post()
                .uri("/predict_url")
                .bodyValue(Map.of("url", url))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnNext(response -> System.out.println("🔍 ML Response: " + response)); // ✅ Afișează răspunsul API
    }

    public Mono<Boolean> checkWithAlienVault(String domain) {
        return alienVaultWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v1/indicators/domain/{domain}/general").build(domain))
                .retrieve()
                .bodyToMono(Map.class)
                .doOnNext(response -> System.out.println("🛰️ AlienVault Response: " + response))
                .map(response -> {
                    if (response != null && response.containsKey("pulse_info")) {
                        Map<String, Object> pulseInfo = (Map<String, Object>) response.get("pulse_info");
                        return pulseInfo.containsKey("count") && (int) pulseInfo.get("count") > 0;
                    }
                    return false;
                })
                .onErrorReturn(false);
    }

    public Mono<Boolean> checkWithVirusTotal(String url) {
        String apiKey = "f591ba36fb617abc9d7bb42d9857fd00ce7db86afa674e480e202e2f3721a57f";

        return WebClient.create("https://www.virustotal.com/api/v3/urls")
                .post()
                .header("x-apikey", apiKey)
                .header("Content-Type", "application/x-www-form-urlencoded") // VirusTotal necesită form-urlencoded
                .bodyValue("url=" + url)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(response -> {
                    System.out.println("🦠 VirusTotal Submit Response: " + response);

                    if (response.containsKey("data") && ((Map<String, Object>) response.get("data")).containsKey("id")) {
                        String analysisId = ((Map<String, Object>) response.get("data")).get("id").toString();
                        return getVirusTotalAnalysis(apiKey, analysisId);
                    } else {
                        return Mono.just(false);
                    }
                })
                .onErrorReturn(false);
    }

    private Mono<Boolean> getVirusTotalAnalysis(String apiKey, String analysisId) {
        return WebClient.create("https://www.virustotal.com/api/v3/analyses/" + analysisId)
                .get()
                .header("x-apikey", apiKey)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    System.out.println("🦠 VirusTotal Analysis Response: " + response);

                    if (response.containsKey("data")) {
                        Map<String, Object> data = (Map<String, Object>) response.get("data");
                        if (data.containsKey("attributes")) {
                            Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
                            if (attributes.containsKey("stats")) {
                                Map<String, Integer> stats = (Map<String, Integer>) attributes.get("stats");
                                int malicious = stats.getOrDefault("malicious", 0);
                                return malicious > 0; // Dacă există detectări, e periculos
                            }
                        }
                    }
                    return false;
                })
                .onErrorReturn(false);
    }

    public Mono<Boolean> checkWithAbuseIPDB(String ip) {
        String apiKey = "7c4cc6fda0e80b89ca519b8f92a672492f80001e34321785d7365642b20125dbc59d9eba1499bf07";
        int days = 90;

        return WebClient.create("https://api.abuseipdb.com/api/v2/check") // Folosește endpoint-ul corect
                .get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("ipAddress", ip) // Parametrul pentru IP
                        .queryParam("maxAgeInDays", days) // Parametrul pentru zile
                        .build())
                .header("Key", apiKey) // Cheia API în header
                .header("Accept", "application/json")
                .retrieve()
                .bodyToMono(Map.class)
                .doOnNext(response -> {
                    System.out.println("🚔 AbuseIPDB Response: " + response);
                    if (response.containsKey("data")) {
                        Map<String, Object> data = (Map<String, Object>) response.get("data");
                        System.out.println("📊 Abuse Confidence Score: " + data.get("abuseConfidenceScore"));
                        System.out.println("📊 Total Reports: " + data.get("totalReports"));
                    } else {
                        System.out.println("❌ Răspuns invalid de la AbuseIPDB");
                    }
                })
                .map(response -> {
                    if (response != null && response.get("data") instanceof Map) {
                        Map<String, Object> data = (Map<String, Object>) response.get("data");

                        int abuseConfidenceScore = (int) data.getOrDefault("abuseConfidenceScore", 0);
                        int totalReports = (int) data.getOrDefault("totalReports", 0);

                        return abuseConfidenceScore > 50 || totalReports > 100;
                    }
                    return false;
                })
                .onErrorResume(e -> {
                    System.err.println("❌ Eroare la verificarea AbuseIPDB: " + e.getMessage());
                    return Mono.just(false);
                });
    }

    public Mono<Boolean> checkWithGoogleSafeBrowsing(String url) {
        String apiKey = "AIzaSyDeVsJexdPnoOyoNpztGospT4l__P0VVQk"; // 🔹 Înlocuiește cu cheia ta API validă

        Map<String, Object> requestBody = Map.of(
                "client", Map.of(
                        "clientId", "guardianBit",
                        "clientVersion", "1.0"
                ),
                "threatInfo", Map.of(
                        "threatTypes", List.of("MALWARE", "SOCIAL_ENGINEERING"),
                        "platformTypes", List.of("ANY_PLATFORM"),
                        "threatEntryTypes", List.of("URL"),
                        "threatEntries", List.of(Map.of("url", url))
                )
        );

        return WebClient.create("https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + apiKey)
                .post()
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnNext(response -> {
                    System.out.println("🔒 Google Safe Browsing Response: " + response);

                    if (response != null && response.containsKey("matches")) {
                        List<Map<String, Object>> matches = (List<Map<String, Object>>) response.get("matches");
                        for (Map<String, Object> match : matches) {
                            System.out.println("⚠️ Threat Found: " + match);
                        }
                    } else {
                        System.out.println("✅ No threats detected.");
                    }
                })
                .map(response -> response != null && response.containsKey("matches"))
                .onErrorReturn(false);
    }

    public Mono<Integer> calculateRiskScore(String url) {
        String redisKey = "malicious_url:" + url;

        Object cachedRiskScore = redisTemplate.opsForValue().get(redisKey);
        if (cachedRiskScore != null) {
            System.out.println("🔴 URL deja identificat în Redis: " + url);
            return Mono.just((Integer) cachedRiskScore);
        }

        String domain = extractDomain(url);
        if (domain == null) {
            System.out.println("❌ Nu s-a putut extrage domeniul din URL: " + url);
            return Mono.just(0);
        }

        String ip = getIpFromDomain(domain);
        if (ip == null) {
            System.out.println("❌ Nu s-a putut rezolva IP-ul pentru domeniul: " + domain);
            return Mono.just(0);
        }

        return Mono.zip(
                processUrl(url),
                checkWithAlienVault(domain),
                checkWithVirusTotal(url),
                checkWithAbuseIPDB(ip),
                checkWithGoogleSafeBrowsing(url)
        ).map(results -> {
            Map<String, Object> mlResponse = results.getT1();
            boolean alienVault = results.getT2();
            boolean virusTotal = results.getT3();
            boolean abuseIPDB = results.getT4();
            boolean googleSafeBrowsing = results.getT5();

            int riskScore = 0;

            if (mlResponse != null && mlResponse.containsKey("predictions")) {
                String prediction = String.valueOf(mlResponse.get("predictions"));
                if ("1".equals(prediction)) {
                    riskScore += 20;
                }
            }

            if (alienVault) riskScore += 50;
            if (virusTotal) riskScore += 50;
            if (abuseIPDB) riskScore += 50;
            if (googleSafeBrowsing) riskScore += 50;


            redisTemplate.opsForValue().set(redisKey, riskScore, 24, TimeUnit.HOURS);
            System.out.println("📝 URL analizat și salvat în Redis: " + url + " (scor: " + riskScore + ")");

            if(riskScore>50)
            {

                if (domain != null) {
                    redisTemplate.opsForZSet().incrementScore("malicious_hits", domain, 1); // Folosește un ZSET cu scoruri
                }

            }


            System.out.println("📊 Final Risk Score: " + riskScore);
            return Math.min(riskScore, 100);
        });
    }

    public List<String> getTopMaliciousDomains(int limit) {
        Set<ZSetOperations.TypedTuple<Object>> topHits = redisTemplate.opsForZSet()
                .reverseRangeWithScores("malicious_hits", 0, limit - 1);

        List<String> result = new ArrayList<>();
        if (topHits != null) {
            for (ZSetOperations.TypedTuple<Object> tuple : topHits) {
                result.add(String.valueOf(tuple.getValue()));
            }
        }
        return result;
    }



}
