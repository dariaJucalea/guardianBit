package com.guardianBit.guardianBit.dto;

public class YaraScanResult {
    private boolean malicious;
    private String reason;

    public YaraScanResult(boolean malicious, String reason) {
        this.malicious = malicious;
        this.reason = reason;
    }

    public boolean isMalicious() {
        return malicious;
    }

    public String getReason() {
        return reason;
    }

    public void setMalicious(boolean malicious) {
        this.malicious = malicious;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
