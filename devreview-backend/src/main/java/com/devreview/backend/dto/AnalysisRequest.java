package com.devreview.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AnalysisRequest {
    @NotBlank(message = "File name is required.")
    @Size(max = 255, message = "File name must be 255 characters or fewer.")
    @Pattern(regexp = "^[^\\\\/:*?\"<>|\\p{Cntrl}]+$", message = "File name must not contain path separators, control characters, or reserved characters.")
    private String fileName;

    @NotBlank(message = "Language is required.")
    @Pattern(regexp = "^(Java|Python|JavaScript)$", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Language must be Java, Python, or JavaScript.")
    private String language;

    @NotBlank(message = "Source code is required.")
    @Size(max = 100000, message = "Source code must be 100,000 characters or fewer.")
    private String codeContent;

    @Size(max = 254, message = "Email must be 254 characters or fewer.")
    @Email(message = "Email must be a valid email address.")
    private String userEmail;

    public AnalysisRequest() {}

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCodeContent() { return codeContent; }
    public void setCodeContent(String codeContent) { this.codeContent = codeContent; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
}