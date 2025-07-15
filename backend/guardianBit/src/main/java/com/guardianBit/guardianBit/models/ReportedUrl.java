package com.guardianBit.guardianBit.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;

@RedisHash("reported_urls")
public class ReportedUrl implements Serializable {
    @Id
    private String id;

    private String url;
    private String email;
    private long timestamp;

    public ReportedUrl(String url, String email) {
        this.url = url;
        this.email = email;
        this.timestamp = System.currentTimeMillis();
    }


    public String getId() { return id; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
