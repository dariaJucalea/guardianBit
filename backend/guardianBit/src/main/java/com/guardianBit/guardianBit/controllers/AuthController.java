package com.guardianBit.guardianBit.controllers;

import com.guardianBit.guardianBit.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.guardianBit.guardianBit.security.JwtUtil;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        if (userService.registerUser(email, password)) {
            return ResponseEntity.ok(Map.of("message", "✅ Înregistrare reușită!"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "❌ Email deja folosit!"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        if (userService.authenticate(email, password)) {
            String token = jwtUtil.generateToken(email); // 🛡️ generează token
            return ResponseEntity.ok(Map.of(
                    "message", "✅ Autentificare reușită!",
                    "email", email,
                    "token", token
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "❌ Email sau parolă incorecte."));
        }
    }

}
