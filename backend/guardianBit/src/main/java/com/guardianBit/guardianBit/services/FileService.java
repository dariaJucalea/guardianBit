package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.dto.CachedScanResult;
import com.guardianBit.guardianBit.dto.YaraScanResult;
import com.guardianBit.guardianBit.repositories.MaliciousUrlRepository;
import com.guardianBit.guardianBit.services.YaraService;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.reactive.function.client.WebClient;
import com.guardianBit.guardianBit.repositories.*;
import com.guardianBit.guardianBit.models.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class FileService {

    private final VirusTotalService virusTotalService;
    private final YaraService yaraService;
    private final HybridAnalysisService hybridAnalysisService;
    private final RedisTemplate<String, Object> redisTemplate;

    public FileService(
            VirusTotalService virusTotalService,
            YaraService yaraService,
            HybridAnalysisService hybridAnalysisService,
            RedisTemplate<String, Object> redisTemplate
    ) {
        this.virusTotalService = virusTotalService;
        this.yaraService = yaraService;
        this.hybridAnalysisService = hybridAnalysisService;
        this.redisTemplate = redisTemplate;
    }

    public Map<String, Object> scanFile(String hash, String filePath) {
        String redisKey = "malicious_file:" + hash;
        Map<String, Object> result = new HashMap<>();

        CachedScanResult cached = (CachedScanResult) redisTemplate.opsForValue().get(redisKey);
        if (cached != null) {
            result.put("source", "Redis Cache");
            result.put("hash", cached.getHash());
            result.put("filePath", filePath);
            result.put("isMalicious", true);
            result.put("vtMalicious", cached.isVirustotal());
            result.put("yaraMalicious", cached.isYara());
            result.put("hybridMalicious", cached.isHybrid());
            result.put("reason",cached.getReason());
            return result;
        }


        boolean vtMalicious = virusTotalService.isHashMalicious(hash, filePath);
        YaraScanResult yaraResult = yaraService.scanFileWithYara(filePath);
        boolean yaraMalicious = yaraResult.isMalicious();
        String reason = yaraResult.getReason();
        String jobId = hybridAnalysisService.submitFile(filePath);
        boolean hybridMalicious = hybridAnalysisService.isFileMaliciousByHash(hash);


        if(reason=="")
        {
            if(vtMalicious==true)
            {
                reason="Fisier gasit ca suspect in VirusTotal.";
            }
            else if(hybridMalicious)
            {
                reason="Fisier gasit ca suspect in HybridAnalysis.";
            }
        }
        boolean isMalicious = vtMalicious || yaraMalicious || hybridMalicious;

        if (isMalicious) {
            CachedScanResult redisValue = new CachedScanResult();
            redisValue.setHash(hash);
            redisValue.setVirustotal(vtMalicious);
            redisValue.setYara(yaraMalicious);
            redisValue.setHybrid(hybridMalicious);
            redisValue.setReason(reason);
            redisTemplate.opsForValue().set(redisKey, redisValue, 1, TimeUnit.HOURS);
        }

        result.put("hash", hash);
        result.put("filePath", filePath);
        result.put("vtMalicious", vtMalicious);
        result.put("yaraMalicious", yaraMalicious);
        result.put("hybridMalicious", hybridMalicious);
        result.put("isMalicious", isMalicious);
        result.put("reason",reason);

        System.out.println("🔍 File scan result: " + result);

        return result;
    }
}

