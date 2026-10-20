package com.devreview.backend.controller;

import com.devreview.backend.dto.AuthRequest;
import com.devreview.backend.dto.AuthResponse;
import com.devreview.backend.model.User;
import com.devreview.backend.repository.UserRepository;
import com.devreview.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AuthController(UserRepository userRepository, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest request) {
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.length() < 2) {
            return ResponseEntity.badRequest().body(Map.of("fullName", "Full name must contain at least 2 characters."));
        }
        if (request.getPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("password", "Password must contain at least 8 characters."));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("email", "Email already in use."));
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                fullName
        );
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFullName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid credentials.");
        }

        String token = jwtUtils.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFullName()));
    }
}