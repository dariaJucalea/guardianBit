package com.guardianBit.guardianBit.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;

@RedisHash("malicious_urls")
public class MaliciousUrl implements Serializable {
    @Id
    private String id;
    private String url;
    private int riskScore;
    private boolean verified;
    private long timestamp;

    public MaliciousUrl(String url, int riskScore, boolean verified) {
        this.url = url;
        this.riskScore = riskScore;
        this.verified = verified;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters & Setters
    public String getId() {
        return id;
    }
    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public int getRiskScore() {
        return riskScore;
    }
    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }
    public boolean getVerified() {
        return verified;
    }
    public void setVerified(boolean verified) {
        this.verified = verified;
    }
    public long getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

}
