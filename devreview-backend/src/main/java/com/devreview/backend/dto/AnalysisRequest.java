package com.devreview.backend.dto;

public class AnalysisRequest {
    private String fileName;
    private String language;
    private String codeContent;
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