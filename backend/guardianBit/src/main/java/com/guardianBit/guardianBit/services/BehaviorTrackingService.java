package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.models.AlertPreferences;
import com.guardianBit.guardianBit.models.BehaviorAlert;
import com.guardianBit.guardianBit.repositories.AlertPreferencesRepository;
import com.guardianBit.guardianBit.repositories.BehaviorAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BehaviorTrackingService {

    private final BehaviorAlertRepository behaviorAlertRepository;
    private final AlertPreferencesRepository alertPreferencesRepository;
    private final EmailService emailService;

    @Autowired
    public BehaviorTrackingService(
            BehaviorAlertRepository behaviorAlertRepository,
            AlertPreferencesRepository alertPreferencesRepository,
            EmailService emailService) {
        this.behaviorAlertRepository = behaviorAlertRepository;
        this.alertPreferencesRepository = alertPreferencesRepository;
        this.emailService = emailService;
    }


    public List<BehaviorAlert> processAlerts(String userId, List<Map<String, Object>> alertsData) {
        List<BehaviorAlert> processedAlerts = new ArrayList<>();

        for (Map<String, Object> alertData : alertsData) {
            BehaviorAlert alert = new BehaviorAlert();
            alert.setUserId(userId);
            alert.setType((String) alertData.get("type"));
            alert.setMessage((String) alertData.get("message"));
            alert.setSeverity((String) alertData.get("severity"));
            alert.setCategory((String) alertData.get("category"));
            alert.setMetadata(alertData);

            BehaviorAlert savedAlert = behaviorAlertRepository.save(alert);
            processedAlerts.add(savedAlert);
        }

        return processedAlerts;
    }


    public List<BehaviorAlert> processCategoryAlerts(String userId, List<Map<String, Object>> alertsData) {
        List<BehaviorAlert> processedAlerts = new ArrayList<>();

        for (Map<String, Object> alertData : alertsData) {
            BehaviorAlert alert = new BehaviorAlert();
            alert.setUserId(userId);
            alert.setType((String) alertData.get("type"));
            alert.setMessage((String) alertData.get("message"));
            alert.setSeverity((String) alertData.get("severity"));
            alert.setCategory("category_alert");
            alert.setMetadata(alertData);

            BehaviorAlert savedAlert = behaviorAlertRepository.save(alert);
            processedAlerts.add(savedAlert);
        }

        return processedAlerts;
    }


    public boolean sendAlertsEmail(String userId, List<BehaviorAlert> alerts) {
        try {
            AlertPreferences preferences = alertPreferencesRepository.findByUserId(userId)
                    .orElse(new AlertPreferences(userId));

            if (!"immediate".equals(preferences.getEmailFrequency()) &&
                    !"daily".equals(preferences.getEmailFrequency())) {
                return false;
            }

            List<BehaviorAlert> filteredAlerts = filterAlertsBySeverity(alerts, preferences.getSeverityThreshold());

            if (filteredAlerts.isEmpty()) {
                return false;
            }

            if (preferences.getQuietHoursEnabled() && isInQuietHours(preferences)) {
                return false;
            }

            String emailSubject = createAlertEmailSubject(filteredAlerts);
            String emailBody = emailService.createAlertEmailBody(filteredAlerts, userId);

            boolean sent = emailService.sendEmail(userId, emailSubject, emailBody);

            if (sent) {
                LocalDateTime now = LocalDateTime.now();
                filteredAlerts.forEach(alert -> {
                    alert.setSentAt(now);
                    behaviorAlertRepository.save(alert);
                });
            }

            return sent;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


    public boolean sendTestAlert(String userId) {
        try {
            BehaviorAlert testAlert = new BehaviorAlert();
            testAlert.setUserId(userId);
            testAlert.setType("test_alert");
            testAlert.setMessage("Aceasta este o alertă de test pentru verificarea sistemului.");
            testAlert.setSeverity("medium");
            testAlert.setCategory("test");

            List<BehaviorAlert> testAlerts = Collections.singletonList(testAlert);

            String emailSubject = "GuardianBit - Test Alertă de Comportament";
            String emailBody = emailService.createAlertEmailBody(testAlerts, userId);

            return emailService.sendEmail(userId, emailSubject, emailBody);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


    public List<BehaviorAlert> getAlertsHistory(String userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return behaviorAlertRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }


    public void saveAlertPreferences(String userId, Map<String, Object> preferencesData) {
        AlertPreferences preferences = alertPreferencesRepository.findByUserId(userId)
                .orElse(new AlertPreferences(userId));

        if (preferencesData.containsKey("email_frequency")) {
            preferences.setEmailFrequency((String) preferencesData.get("email_frequency"));
        }
        if (preferencesData.containsKey("alert_types")) {
            @SuppressWarnings("unchecked")
            List<String> alertTypes = (List<String>) preferencesData.get("alert_types");
            preferences.setAlertTypes(alertTypes);
        }
        if (preferencesData.containsKey("severity_threshold")) {
            preferences.setSeverityThreshold((String) preferencesData.get("severity_threshold"));
        }
        if (preferencesData.containsKey("quiet_hours_enabled")) {
            preferences.setQuietHoursEnabled((Boolean) preferencesData.get("quiet_hours_enabled"));
        }
        if (preferencesData.containsKey("quiet_hours_start")) {
            preferences.setQuietHoursStart((Integer) preferencesData.get("quiet_hours_start"));
        }
        if (preferencesData.containsKey("quiet_hours_end")) {
            preferences.setQuietHoursEnd((Integer) preferencesData.get("quiet_hours_end"));
        }

        preferences.setUpdatedAt(LocalDateTime.now());
        alertPreferencesRepository.save(preferences);
    }



    private List<BehaviorAlert> filterAlertsBySeverity(List<BehaviorAlert> alerts, String severityThreshold) {
        List<String> allowedSeverities = switch (severityThreshold) {
            case "low" -> Arrays.asList("low", "medium", "high");
            case "medium" -> Arrays.asList("medium", "high");
            case "high" -> Collections.singletonList("high");
            default -> Arrays.asList("medium", "high");
        };

        return alerts.stream()
                .filter(alert -> allowedSeverities.contains(alert.getSeverity()))
                .collect(Collectors.toList());
    }

    private boolean isInQuietHours(AlertPreferences preferences) {
        int currentHour = LocalDateTime.now().getHour();
        int startHour = preferences.getQuietHoursStart();
        int endHour = preferences.getQuietHoursEnd();

        return (startHour <= endHour)
                ? currentHour >= startHour && currentHour < endHour
                : currentHour >= startHour || currentHour < endHour;
    }

    private String createAlertEmailSubject(List<BehaviorAlert> alerts) {
        if (alerts.size() == 1) {
            String severityPrefix = getSeverityPrefix(alerts.get(0).getSeverity());
            return String.format("GuardianBit - %s Alertă de comportament", severityPrefix);
        } else {
            return String.format("GuardianBit - %d alerte de comportament detectate", alerts.size());
        }
    }

    private String getSeverityPrefix(String severity) {
        return switch (severity) {
            case "high" -> "IMPORTANT:";
            case "low" -> "Info:";
            default -> "";
        };
    }
}
