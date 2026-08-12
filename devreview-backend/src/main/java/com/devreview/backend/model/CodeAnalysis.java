package com.devreview.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "code_analyses")
public class CodeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String language;
    private Integer qualityScore;
    private Integer totalIssues;

    private String userEmail;

    @OneToMany(mappedBy = "analysis", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<AnalysisIssue> issues = new ArrayList<>();

    public CodeAnalysis() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public Integer getTotalIssues() { return totalIssues; }
    public void setTotalIssues(Integer totalIssues) { this.totalIssues = totalIssues; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public List<AnalysisIssue> getIssues() { return issues; }
    public void setIssues(List<AnalysisIssue> issues) { this.issues = issues; }
}