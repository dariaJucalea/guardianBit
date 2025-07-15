// AlertPreferences.java
package com.guardianBit.guardianBit.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "alert_preferences")
public class AlertPreferences {
    @Id
    private String id;
    private String userId;
    private String emailFrequency = "daily";
    private List<String> alertTypes;
    private String severityThreshold = "medium";
    private Boolean quietHoursEnabled = false;
    private Integer quietHoursStart = 22;
    private Integer quietHoursEnd = 8;
    private Map<String, Object> customSettings;
    private LocalDateTime updatedAt = LocalDateTime.now();


    public AlertPreferences() {}


    public AlertPreferences(String userId) {
        this.userId = userId;
    }


    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmailFrequency() { return emailFrequency; }
    public void setEmailFrequency(String emailFrequency) { this.emailFrequency = emailFrequency; }

    public List<String> getAlertTypes() { return alertTypes; }
    public void setAlertTypes(List<String> alertTypes) { this.alertTypes = alertTypes; }

    public String getSeverityThreshold() { return severityThreshold; }
    public void setSeverityThreshold(String severityThreshold) { this.severityThreshold = severityThreshold; }

    public Boolean getQuietHoursEnabled() { return quietHoursEnabled; }
    public void setQuietHoursEnabled(Boolean quietHoursEnabled) { this.quietHoursEnabled = quietHoursEnabled; }

    public Integer getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(Integer quietHoursStart) { this.quietHoursStart = quietHoursStart; }

    public Integer getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(Integer quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }

    public Map<String, Object> getCustomSettings() { return customSettings; }
    public void setCustomSettings(Map<String, Object> customSettings) { this.customSettings = customSettings; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}