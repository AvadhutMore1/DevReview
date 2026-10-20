package com.devreview.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequest {
    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 254, message = "Email must be 254 characters or fewer.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(max = 72, message = "Password must be 72 characters or fewer.")
    private String password;

    @Size(max = 80, message = "Full name must be 80 characters or fewer.")
    private String fullName;

    public AuthRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}