package com.guardianBit.guardianBit.dto;

public class CachedScanResult {
    private String hash;
    private boolean virustotal;
    private boolean yara;
    private boolean hybrid;
    private String reason;

    public String getHash() {
        return hash;
    }

    public String getReason()
    {
        return reason;
    }

    public void setReason(String reason)
    {
        this.reason=reason;
    }
    public void setHash(String hash) {
        this.hash = hash;
    }

    public boolean isVirustotal() {
        return virustotal;
    }

    public void setVirustotal(boolean virustotal) {
        this.virustotal = virustotal;
    }

    public boolean isYara() {
        return yara;
    }

    public void setYara(boolean yara) {
        this.yara = yara;
    }

    public boolean isHybrid() {
        return hybrid;
    }

    public void setHybrid(boolean hybrid) {
        this.hybrid = hybrid;
    }
}
