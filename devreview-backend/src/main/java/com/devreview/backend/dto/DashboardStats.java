package com.devreview.backend.dto;

import java.io.Serializable;

public class DashboardStats implements Serializable {
    private long totalScans;
    private double averageQualityScore;
    private long totalIssuesFound;

    public DashboardStats() {}

    public DashboardStats(long totalScans, double averageQualityScore, long totalIssuesFound) {
        this.totalScans = totalScans;
        this.averageQualityScore = averageQualityScore;
        this.totalIssuesFound = totalIssuesFound;
    }

    public long getTotalScans() { return totalScans; }
    public void setTotalScans(long totalScans) { this.totalScans = totalScans; }

    public double getAverageQualityScore() { return averageQualityScore; }
    public void setAverageQualityScore(double averageQualityScore) { this.averageQualityScore = averageQualityScore; }

    public long getTotalIssuesFound() { return totalIssuesFound; }
    public void setTotalIssuesFound(long totalIssuesFound) { this.totalIssuesFound = totalIssuesFound; }
}