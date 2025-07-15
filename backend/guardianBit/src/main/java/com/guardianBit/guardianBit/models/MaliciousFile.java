package com.guardianBit.guardianBit.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;

@RedisHash("malicious_files")
public class MaliciousFile implements Serializable {
    @Id
    private String id;
    private String fileHash;
    private boolean detectedByYara;
    private boolean detectedByVirusTotal;
    private long timestamp;

    public MaliciousFile(String fileHash, boolean detectedByYara, boolean detectedByVirusTotal) {
        this.fileHash = fileHash;
        this.detectedByYara = detectedByYara;
        this.detectedByVirusTotal = detectedByVirusTotal;
        this.timestamp = System.currentTimeMillis();
    }


    public String getId() {
        return id;
    }
    String getFileHash() {
        return fileHash;
    }
    void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }
    boolean getDetectedByYara() {
        return detectedByYara;
    }
    void setDetectedByYara(boolean detectedByYara) {
        this.detectedByYara = detectedByYara;
    }
    boolean getDetectedByVirusTotal() {
        return detectedByVirusTotal;
    }
    void setDetectedByVirusTotal(boolean detectedByVirusTotal) {
        this.detectedByVirusTotal = detectedByVirusTotal;
    }
    long getTimestamp() {
        return timestamp;
    }
    void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

}
