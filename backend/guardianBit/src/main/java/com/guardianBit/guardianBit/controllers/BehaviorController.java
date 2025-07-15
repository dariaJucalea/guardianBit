package com.guardianBit.guardianBit.controllers;

import com.guardianBit.guardianBit.models.BehaviorAlert;
import com.guardianBit.guardianBit.services.BehaviorTrackingService;
import com.guardianBit.guardianBit.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/behavior")
public class BehaviorController {

    private final BehaviorTrackingService behaviorService;
    private final JwtUtil jwtUtil;

    public BehaviorController(BehaviorTrackingService behaviorService, JwtUtil jwtUtil) {
        this.behaviorService = behaviorService;
        this.jwtUtil = jwtUtil;
    }



    @PostMapping("/alerts")
    public ResponseEntity<?> receiveBehaviorAlerts(@RequestBody Map<String, Object> alertData, HttpServletRequest request) {
        String email = getCurrentUserEmail(request);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            String userId = (String) alertData.get("userId");

            // Verifică că utilizatorul curent este cel care trimite alertele
            if (!email.equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> alerts = (List<Map<String, Object>>) alertData.get("alerts");

            if (alerts == null || alerts.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "success", "message", "No alerts to process"));
            }

            // Procesează și salvează alertele
            List<BehaviorAlert> processedAlerts = behaviorService.processAlerts(email, alerts);

            // Trimite email cu alertele
            boolean emailSent = behaviorService.sendAlertsEmail(email, processedAlerts);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", alerts.size() + " alerts received",
                    "email_sent", emailSent
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/category-alerts")
    public ResponseEntity<?> receiveCategoryAlerts(@RequestBody Map<String, Object> alertData, HttpServletRequest request) {
        String email = getCurrentUserEmail(request);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            String userId = (String) alertData.get("userId");

            if (!email.equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> alerts = (List<Map<String, Object>>) alertData.get("alerts");

            if (alerts == null || alerts.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "success", "message", "No category alerts to process"));
            }


            List<BehaviorAlert> processedAlerts = behaviorService.processCategoryAlerts(email, alerts);


            List<BehaviorAlert> highSeverityAlerts = processedAlerts.stream()
                    .filter(alert -> "high".equals(alert.getSeverity()))
                    .toList();

            boolean emailSent = false;
            if (!highSeverityAlerts.isEmpty()) {
                emailSent = behaviorService.sendAlertsEmail(email, highSeverityAlerts);
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", alerts.size() + " category alerts received",
                    "high_severity_sent", highSeverityAlerts.size(),
                    "email_sent", emailSent
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



    @GetMapping("/alerts/history")
    public ResponseEntity<?> getAlertsHistory(HttpServletRequest request) {
        String email = getCurrentUserEmail(request);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            List<BehaviorAlert> alerts = behaviorService.getAlertsHistory(email, 50);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "alerts", alerts,
                    "total_count", alerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/alert-preferences")
    public ResponseEntity<?> setAlertPreferences(@RequestBody Map<String, Object> preferences, HttpServletRequest request) {
        String email = getCurrentUserEmail(request);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            behaviorService.saveAlertPreferences(email, preferences);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Preferences updated",
                    "preferences", preferences
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/test-alert")
    public ResponseEntity<?> testAlertSystem(HttpServletRequest request) {
        String email = getCurrentUserEmail(request);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            boolean emailSent = behaviorService.sendTestAlert(email);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Test alert sent",
                    "email_sent", emailSent
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String getCurrentUserEmail(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.getEmailFromToken(token);
            }
        }
        return null;
    }
}