package com.devreview.backend.controller;

import com.devreview.backend.dto.AnalysisRequest;
import com.devreview.backend.dto.DashboardStats;
import com.devreview.backend.model.CodeAnalysis;
import com.devreview.backend.repository.CodeAnalysisRepository;
import com.devreview.backend.service.CodeAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analyses")
@CrossOrigin(origins = "*")
public class CodeAnalysisController {

    private final CodeAnalyzerService codeAnalyzerService;
    private final CodeAnalysisRepository analysisRepository;

    @Autowired
    public CodeAnalysisController(CodeAnalyzerService codeAnalyzerService, CodeAnalysisRepository analysisRepository) {
        this.codeAnalyzerService = codeAnalyzerService;
        this.analysisRepository = analysisRepository;
    }

    @PostMapping("/analyze")
    public ResponseEntity<CodeAnalysis> analyzeCode(@Valid @RequestBody AnalysisRequest request) {
        CodeAnalysis result = codeAnalyzerService.analyzeCode(
                request.getFileName(),
                request.getLanguage(),
                request.getCodeContent(),
                request.getUserEmail()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refactor")
    public ResponseEntity<String> refactorCode(@RequestBody AnalysisRequest request) {
        String fixedCode = codeAnalyzerService.generateRefactoredCode(
                request.getLanguage(),
                request.getCodeContent()
        );
        return ResponseEntity.ok(fixedCode);
    }

    @GetMapping
    public ResponseEntity<List<CodeAnalysis>> getAllAnalyses(@RequestParam(required = false) String email) {
        if (email != null && !email.trim().isEmpty()) {
            return ResponseEntity.ok(analysisRepository.findByUserEmail(email));
        }
        return ResponseEntity.ok(analysisRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getDashboardStats(@RequestParam(required = false) String email) {
        List<CodeAnalysis> all = (email != null && !email.trim().isEmpty()) 
                ? analysisRepository.findByUserEmail(email) 
                : analysisRepository.findAll();

        long totalScans = all.size();
        long totalIssues = all.stream().mapToLong(a -> a.getTotalIssues() != null ? a.getTotalIssues() : 0).sum();
        double avgScore = all.isEmpty() ? 100.0 : all.stream().mapToInt(a -> a.getQualityScore() != null ? a.getQualityScore() : 100).average().orElse(100.0);

        return ResponseEntity.ok(new DashboardStats(totalScans, Math.round(avgScore * 10.0) / 10.0, totalIssues));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CodeAnalysis> getAnalysisById(@PathVariable Long id) {
        return analysisRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable Long id) {
        if (analysisRepository.existsById(id)) {
            analysisRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}