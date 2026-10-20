package com.devreview.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "analysis_issues")
public class AnalysisIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer lineNumber;
    private String severity;
    private String issueType;
    private String message;
    private String suggestion;
    @Column(length = 1000)
    private String cause;
    @Column(length = 1000)
    private String impact;

    @ManyToOne
    @JoinColumn(name = "analysis_id")
    @JsonBackReference
    private CodeAnalysis analysis;

    public AnalysisIssue() {}

    public AnalysisIssue(Integer lineNumber, String severity, String issueType, String message, String suggestion) {
        this(lineNumber, severity, issueType, message, suggestion,
                "This pattern may indicate an unsafe or unreliable implementation.",
                "If left unresolved, it may cause defects, security exposure, or operational problems.");
    }

    public AnalysisIssue(Integer lineNumber, String severity, String issueType, String message, String suggestion,
                         String cause, String impact) {
        this.lineNumber = lineNumber;
        this.severity = severity;
        this.issueType = issueType;
        this.message = message;
        this.suggestion = suggestion;
        this.cause = cause;
        this.impact = impact;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getLineNumber() { return lineNumber; }
    public void setLineNumber(Integer lineNumber) { this.lineNumber = lineNumber; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSuggestion() { return suggestion; }
    public void setSuggestion(String suggestion) { this.suggestion = suggestion; }

    public String getCause() { return cause; }
    public void setCause(String cause) { this.cause = cause; }

    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }

    public CodeAnalysis getAnalysis() { return analysis; }
    public void setAnalysis(CodeAnalysis analysis) { this.analysis = analysis; }
}