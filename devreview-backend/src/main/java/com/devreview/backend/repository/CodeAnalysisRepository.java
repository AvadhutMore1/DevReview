package com.devreview.backend.repository;

import com.devreview.backend.model.CodeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CodeAnalysisRepository extends JpaRepository<CodeAnalysis, Long> {
    List<CodeAnalysis> findByUserEmail(String userEmail);
}