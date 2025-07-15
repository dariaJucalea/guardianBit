package com.guardianBit.guardianBit.dto;

public class FileScanRequest {

    private String hash;
    private String filePath;


    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}
