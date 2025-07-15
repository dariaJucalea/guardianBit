package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.models.BehaviorAlert;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Import-uri pentru Jakarta Mail (Spring Boot 3)
import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Properties;

@Service
public class EmailService {

    @Value("${spring.smtp.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.smtp.port:587}")
    private int smtpPort;

    @Value("${spring.mail.username}")
    private String emailUsername;

    @Value("${spring.mail.password}")
    private String emailPassword;

    @Value("${app.email.from:GuardianBit <noreply@guardianbit.com>}")
    private String fromEmail;

    @Value("${spring.enabled:true}")
    private boolean emailEnabled;


    public boolean sendEmail(String toEmail, String subject, String body) {
        if (!emailEnabled) {
            System.out.println("Email disabled. Would send to: " + toEmail);
            return false;
        }

        try {

            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", smtpHost);
            props.put("mail.smtp.port", String.valueOf(smtpPort));
            props.put("mail.smtp.ssl.trust", smtpHost);


            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(emailUsername, emailPassword);
                }
            });


            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(fromEmail));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject);


            if (body.contains("<html") || body.contains("<HTML")) {
                message.setContent(body, "text/html; charset=UTF-8");
            } else {
                message.setText(body, "UTF-8");
            }


            Transport.send(message);
            System.out.println("✅ Email sent successfully to: " + toEmail);
            return true;

        } catch (MessagingException e) {
            System.err.println("❌ Error sending email: " + e.getMessage());
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            System.err.println("❌ Unexpected error sending email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }


    public String createAlertEmailBody(List<BehaviorAlert> alerts, String userEmail) {
        StringBuilder htmlBuilder = new StringBuilder();

        htmlBuilder.append("<!DOCTYPE html>");
        htmlBuilder.append("<html>");
        htmlBuilder.append("<head>");
        htmlBuilder.append("<meta charset=\"UTF-8\">");
        htmlBuilder.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        htmlBuilder.append("<style>");
        htmlBuilder.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }");
        htmlBuilder.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        htmlBuilder.append(".header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }");
        htmlBuilder.append(".alert { background-color: #f5f5f5; border-left: 4px solid #2196F3; margin: 10px 0; padding: 15px; border-radius: 0 8px 8px 0; }");
        htmlBuilder.append(".alert.medium { border-left-color: #ff9800; }");
        htmlBuilder.append(".alert.high { border-left-color: #f44336; }");
        htmlBuilder.append(".alert-type { font-weight: bold; color: #2196F3; margin-bottom: 5px; }");
        htmlBuilder.append(".footer { margin-top: 30px; padding: 20px; background-color: #fafafa; text-align: center; font-size: 0.9em; color: #666; border-radius: 0 0 10px 10px; }");
        htmlBuilder.append(".timestamp { color: #999; font-size: 0.85em; }");
        htmlBuilder.append("</style>");
        htmlBuilder.append("</head>");
        htmlBuilder.append("<body>");

        htmlBuilder.append("<div class=\"container\">");
        htmlBuilder.append("<div class=\"header\">");
        htmlBuilder.append("<h1>🛡️ GuardianBit - Alertă de Comportament</h1>");
        htmlBuilder.append("<div class=\"timestamp\">Detectată la: ");
        htmlBuilder.append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        htmlBuilder.append("</div>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("<div style=\"padding: 20px;\">");
        htmlBuilder.append("<p>Bună, <strong>").append(userEmail).append("</strong>,</p>");
        htmlBuilder.append("<p>Am detectat câteva activități neobișnuite în comportamentul tău de navigare:</p>");

        htmlBuilder.append("<h3 style=\"color: #2196F3; margin-top: 25px;\">📊 Alertele detectate:</h3>");

        for (BehaviorAlert alert : alerts) {
            String severity = alert.getSeverity() != null ? alert.getSeverity() : "medium";
            String alertType = getAlertTypeDisplay(alert.getType());
            String message = alert.getMessage();

            htmlBuilder.append("<div class=\"alert ").append(severity).append("\">");
            htmlBuilder.append("<div class=\"alert-type\">").append(alertType).append("</div>");
            htmlBuilder.append("<p>").append(message).append("</p>");
            htmlBuilder.append("</div>");
        }

        htmlBuilder.append("<div style=\"background-color: #e8f5e9; border-radius: 8px; padding: 15px; margin: 25px 0;\">");
        htmlBuilder.append("<h4 style=\"color: #2e7d32; margin-top: 0;\">💡 Ce înseamnă acestea?</h4>");
        htmlBuilder.append("<p style=\"margin-bottom: 0;\">Aceste alerte sunt generate automat pe baza pattern-urilor tale obișnuite de navigare și nu sunt neapărat motive de îngrijorare. Sunt menite să îți ofere insight-uri despre comportamentul tău online.</p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("<div style=\"background-color: #fff3e0; border-radius: 8px; padding: 15px; margin: 25px 0;\">");
        htmlBuilder.append("<h4 style=\"color: #f57c00; margin-top: 0;\">⚙️ Gestionează alertele</h4>");
        htmlBuilder.append("<p style=\"margin-bottom: 0;\">Dacă dorești să modifici tipurile de alerte pe care le primești, te rugăm să accesezi setările din extensia GuardianBit.</p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("</div>");

        htmlBuilder.append("<div class=\"footer\">");
        htmlBuilder.append("<p>Acesta este un email automat generat de GuardianBit.<br>");
        htmlBuilder.append("Pentru a reduce frecvența alertelor, accesează setările din extensie.</p>");
        htmlBuilder.append("<p>© 2025 GuardianBit. Toate drepturile rezervate.</p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("</div>");
        htmlBuilder.append("</body>");
        htmlBuilder.append("</html>");

        return htmlBuilder.toString();
    }


    public String createWeeklySummaryEmail(String userEmail, Map<String, Object> summaryData) {
        double totalHours = ((Number) summaryData.getOrDefault("totalHours", 0)).doubleValue();
        int totalSites = ((Number) summaryData.getOrDefault("totalSites", 0)).intValue();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topSites = (List<Map<String, Object>>) summaryData.getOrDefault("topSites", List.of());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topCategories = (List<Map<String, Object>>) summaryData.getOrDefault("topCategories", List.of());

        StringBuilder htmlBuilder = new StringBuilder();

        htmlBuilder.append("<!DOCTYPE html>");
        htmlBuilder.append("<html>");
        htmlBuilder.append("<head>");
        htmlBuilder.append("<meta charset=\"UTF-8\">");
        htmlBuilder.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        htmlBuilder.append("<style>");
        htmlBuilder.append("body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }");
        htmlBuilder.append(".container { max-width: 700px; margin: 0 auto; padding: 20px; }");
        htmlBuilder.append(".header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }");
        htmlBuilder.append(".content { background: white; padding: 25px; }");
        htmlBuilder.append(".stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }");
        htmlBuilder.append(".stat-card { background: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }");
        htmlBuilder.append(".stat-value { font-size: 2em; font-weight: bold; color: #2196F3; display: block; }");
        htmlBuilder.append(".stat-label { color: #666; font-size: 0.9em; margin-top: 5px; }");
        htmlBuilder.append(".section { margin: 30px 0; }");
        htmlBuilder.append(".section h3 { color: #2196F3; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }");
        htmlBuilder.append(".site-list { list-style: none; padding: 0; }");
        htmlBuilder.append(".site-list li { background: #f8f9fa; margin: 8px 0; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }");
        htmlBuilder.append(".footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 12px 12px; }");
        htmlBuilder.append("</style>");
        htmlBuilder.append("</head>");
        htmlBuilder.append("<body>");

        htmlBuilder.append("<div class=\"container\">");
        htmlBuilder.append("<div class=\"header\">");
        htmlBuilder.append("<h1>🛡️ Sumarul Săptămânal</h1>");
        htmlBuilder.append("<p>Activitatea ta de navigare din perioada ");
        htmlBuilder.append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
        htmlBuilder.append("</p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("<div class=\"content\">");
        htmlBuilder.append("<div class=\"stats-grid\">");
        htmlBuilder.append("<div class=\"stat-card\">");
        htmlBuilder.append("<span class=\"stat-value\">").append(String.format("%.1f", totalHours)).append("</span>");
        htmlBuilder.append("<div class=\"stat-label\">ore de navigare</div>");
        htmlBuilder.append("</div>");
        htmlBuilder.append("<div class=\"stat-card\">");
        htmlBuilder.append("<span class=\"stat-value\">").append(totalSites).append("</span>");
        htmlBuilder.append("<div class=\"stat-label\">site-uri vizitate</div>");
        htmlBuilder.append("</div>");
        htmlBuilder.append("<div class=\"stat-card\">");
        htmlBuilder.append("<span class=\"stat-value\">").append(topSites.size()).append("</span>");
        htmlBuilder.append("<div class=\"stat-label\">site-uri noi</div>");
        htmlBuilder.append("</div>");
        htmlBuilder.append("</div>");


        if (!topSites.isEmpty()) {
            htmlBuilder.append("<div class=\"section\">");
            htmlBuilder.append("<h3>🏆 Top 5 Site-uri</h3>");
            htmlBuilder.append("<ul class=\"site-list\">");

            for (int i = 0; i < Math.min(5, topSites.size()); i++) {
                Map<String, Object> site = (Map<String, Object>) topSites.get(i);
                htmlBuilder.append("<li>");
                htmlBuilder.append("<span style=\"font-weight: 500;\">").append(site.get("domain")).append("</span>");
                htmlBuilder.append("<span style=\"color: #666; font-size: 0.9em;\">").append(((Number) site.get("timeMinutes")).intValue()).append(" min</span>");
                htmlBuilder.append("</li>");
            }

            htmlBuilder.append("</ul></div>");
        }


        if (!topCategories.isEmpty()) {
            htmlBuilder.append("<div class=\"section\">");
            htmlBuilder.append("<h3>📊 Categorii de interes</h3>");
            htmlBuilder.append("<ul class=\"site-list\">");

            for (int i = 0; i < Math.min(3, topCategories.size()); i++) {
                Map<String, Object> category = (Map<String, Object>) topCategories.get(i);
                htmlBuilder.append("<li>");
                htmlBuilder.append("<span style=\"font-weight: 500;\">").append(category.get("displayName")).append("</span>");
                htmlBuilder.append("<span style=\"color: #666; font-size: 0.9em;\">").append(String.format("%.1f", ((Number) category.get("totalTimeHours")).doubleValue())).append(" ore</span>");
                htmlBuilder.append("</li>");
            }

            htmlBuilder.append("</ul></div>");
        }

        htmlBuilder.append("</div>");

        htmlBuilder.append("<div class=\"footer\">");
        htmlBuilder.append("<p>Acest email este generat automat de GuardianBit.<br>");
        htmlBuilder.append("Pentru a modifica frecvența acestor rapoarte, accesează setările din extensie.</p>");
        htmlBuilder.append("<p>© 2025 GuardianBit. Toate drepturile rezervate.</p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("</div>");
        htmlBuilder.append("</body>");
        htmlBuilder.append("</html>");

        return htmlBuilder.toString();
    }


    public String createTestEmailBody(String userEmail) {
        StringBuilder htmlBuilder = new StringBuilder();

        htmlBuilder.append("<!DOCTYPE html>");
        htmlBuilder.append("<html>");
        htmlBuilder.append("<head>");
        htmlBuilder.append("<meta charset=\"UTF-8\">");
        htmlBuilder.append("<style>");
        htmlBuilder.append("body { font-family: Arial, sans-serif; color: #333; }");
        htmlBuilder.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        htmlBuilder.append(".header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }");
        htmlBuilder.append(".content { padding: 20px; }");
        htmlBuilder.append("</style>");
        htmlBuilder.append("</head>");
        htmlBuilder.append("<body>");

        htmlBuilder.append("<div class=\"container\">");
        htmlBuilder.append("<div class=\"header\">");
        htmlBuilder.append("<h1>✅ Test Email GuardianBit</h1>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("<div class=\"content\">");
        htmlBuilder.append("<p>Salut, <strong>").append(userEmail).append("</strong>!</p>");
        htmlBuilder.append("<p>Acesta este un email de test pentru a verifica că sistemul de alerte email funcționează corect.</p>");
        htmlBuilder.append("<p>Dacă primești acest email, înseamnă că configurația este corectă și poți primi alerte de comportament.</p>");
        htmlBuilder.append("<hr>");
        htmlBuilder.append("<p><small>Email generat automat de GuardianBit la ");
        htmlBuilder.append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
        htmlBuilder.append("</small></p>");
        htmlBuilder.append("</div>");

        htmlBuilder.append("</div>");
        htmlBuilder.append("</body>");
        htmlBuilder.append("</html>");

        return htmlBuilder.toString();
    }



    private String getAlertTypeDisplay(String alertType) {
        if (alertType == null) return "🔔 Notificare comportament";

        return switch (alertType) {
            case "long_visit" -> "🕒 Timp lung pe site";
            case "night_activity" -> "🌙 Activitate nocturnă";
            case "offhour_activity" -> "⚠️ Activitate în afara orelor tipice";
            case "unusual_day_activity" -> "📅 Activitate neobișnuită zilnică";
            case "high_site_count" -> "📚 Multe site-uri vizitate";
            case "sensitive_category_activity" -> "⚠️ Activitate în categorii sensibile";
            case "excessive_risk_category_time" -> "🚨 Timp excessiv pe site-uri de risc";
            case "major_interest_shift" -> "📊 Schimbare majoră în interese";
            default -> "🔔 Notificare comportament";
        };
    }
}