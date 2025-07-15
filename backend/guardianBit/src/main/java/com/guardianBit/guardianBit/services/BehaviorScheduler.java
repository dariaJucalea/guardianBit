package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.models.AlertPreferences;
import com.guardianBit.guardianBit.models.BehaviorAlert;
import com.guardianBit.guardianBit.repositories.AlertPreferencesRepository;
import com.guardianBit.guardianBit.repositories.BehaviorAlertRepository;
import com.guardianBit.guardianBit.repositories.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class BehaviorScheduler {

    private final BehaviorTrackingService behaviorTrackingService;
    private final BehaviorAlertRepository behaviorAlertRepository;
    private final AlertPreferencesRepository alertPreferencesRepository;
    private final UserRepository userRepository;

    public BehaviorScheduler(
            BehaviorTrackingService behaviorTrackingService,
            BehaviorAlertRepository behaviorAlertRepository,
            AlertPreferencesRepository alertPreferencesRepository,
            UserRepository userRepository) {
        this.behaviorTrackingService = behaviorTrackingService;
        this.behaviorAlertRepository = behaviorAlertRepository;
        this.alertPreferencesRepository = alertPreferencesRepository;
        this.userRepository = userRepository;
    }


    @Scheduled(cron = "0 0 9 * * ?")
    public void sendDailyDigests() {
        System.out.println("📧 Starting daily digest sending...");

        List<AlertPreferences> dailyUsers = alertPreferencesRepository.findAll().stream()
                .filter(prefs -> "daily".equals(prefs.getEmailFrequency()))
                .toList();

        for (AlertPreferences prefs : dailyUsers) {
            try {
                sendDigestForUser(prefs.getUserId(), 1, "GuardianBit - Rezumatul zilei");
            } catch (Exception e) {
                System.err.println("Error sending daily digest for user " + prefs.getUserId() + ": " + e.getMessage());
            }
        }

        System.out.println("✅ Daily digest sending completed");
    }


    @Scheduled(cron = "0 0 10 * * MON")
    public void sendWeeklySummaries() {
        System.out.println("📊 Starting weekly summary sending...");

        List<AlertPreferences> weeklyUsers = alertPreferencesRepository.findAll().stream()
                .filter(prefs -> "weekly".equals(prefs.getEmailFrequency()))
                .toList();

        for (AlertPreferences prefs : weeklyUsers) {
            try {
                sendDigestForUser(prefs.getUserId(), 7, "GuardianBit - Sumarul săptămânal");
            } catch (Exception e) {
                System.err.println("Error sending weekly summary for user " + prefs.getUserId() + ": " + e.getMessage());
            }
        }

        System.out.println("✅ Weekly summary sending completed");
    }


    @Scheduled(fixedRate = 300000)
    public void processImmediateAlerts() {
        System.out.println("🔔 Checking immediate alerts...");

        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        List<BehaviorAlert> pendingAlerts = behaviorAlertRepository.findPendingEmailAlerts(fiveMinutesAgo);

        Map<String, List<BehaviorAlert>> alertsByUser = pendingAlerts.stream()
                .collect(Collectors.groupingBy(BehaviorAlert::getUserId));

        for (Map.Entry<String, List<BehaviorAlert>> entry : alertsByUser.entrySet()) {
            String userId = entry.getKey();
            List<BehaviorAlert> alerts = entry.getValue();

            AlertPreferences prefs = alertPreferencesRepository.findByUserId(userId)
                    .orElse(new AlertPreferences(userId));

            if ("immediate".equals(prefs.getEmailFrequency())) {
                try {
                    behaviorTrackingService.sendAlertsEmail(userId, alerts);
                    System.out.println("📧 Sent immediate alerts to user: " + userId);
                } catch (Exception e) {
                    System.err.println("Error sending immediate alerts to user " + userId + ": " + e.getMessage());
                }
            }
        }
    }


    private void sendDigestForUser(String userId, int daysBack, String subject) {
        LocalDateTime since = LocalDateTime.now().minusDays(daysBack);
        List<BehaviorAlert> alerts = behaviorAlertRepository.findRecentAlertsByUserId(userId, since);

        if (!alerts.isEmpty()) {
            behaviorTrackingService.sendAlertsEmail(userId, alerts);
        }
    }
}
