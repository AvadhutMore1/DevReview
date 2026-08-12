package com.devreview.backend.service;

import com.devreview.backend.model.AnalysisIssue;
import com.devreview.backend.model.CodeAnalysis;
import com.devreview.backend.repository.CodeAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class CodeAnalyzerService {

    private final CodeAnalysisRepository analysisRepository;

    @Autowired
    public CodeAnalyzerService(CodeAnalysisRepository analysisRepository) {
        this.analysisRepository = analysisRepository;
    }

    public CodeAnalysis analyzeCode(String fileName, String language, String codeContent, String userEmail) {
        List<AnalysisIssue> issues = new ArrayList<>();
        String[] lines = codeContent.split("\n");
        int qualityScore = 100;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            int lineNumber = i + 1;

            if (Pattern.compile("(?i).*?(api[_-]?key|secret|password|token|bearer)\\s*=\\s*['\"].+['\"].*").matcher(line).matches()) {
                issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY", "Potential hardcoded secret or API key detected.", "Store sensitive credentials in environment variables."));
                qualityScore -= 20;
            }

            if ("Java".equalsIgnoreCase(language)) {
                if (Pattern.compile("(?i).*?(SELECT|INSERT|UPDATE|DELETE).*?\\+.*?").matcher(line).matches()) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY", "Possible SQL Injection vulnerability via string concatenation.", "Use PreparedStatements or parameterized queries."));
                    qualityScore -= 25;
                }
                if (line.contains("catch") && line.contains("{}")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX", "Empty catch block silently ignores exceptions.", "Log the exception stack trace or rethrow it."));
                    qualityScore -= 10;
                }
                if (line.contains("System.out.println")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE", "Direct standard output usage detected.", "Replace print statements with structured logging."));
                    qualityScore -= 5;
                }
            } else if ("Python".equalsIgnoreCase(language)) {
                if (line.startsWith("except:") || line.startsWith("except Exception:")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX", "Bare or overly broad exception catching detected.", "Catch specific exception types (e.g., ValueError, KeyError)."));
                    qualityScore -= 10;
                }
                if (line.contains("eval(") || line.contains("exec(")) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY", "Dynamic code execution via eval() or exec() detected.", "Avoid eval()/exec() to prevent arbitrary code execution vulnerabilities."));
                    qualityScore -= 30;
                }
                if (line.contains("print(")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE", "Direct print() usage detected.", "Use Python's built-in `logging` module for production code."));
                    qualityScore -= 5;
                }
            } else if ("JavaScript".equalsIgnoreCase(language)) {
                if (line.contains("var ")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX", "Legacy 'var' variable declaration detected.", "Use 'const' or 'let' to ensure proper block scoping."));
                    qualityScore -= 10;
                }
                if (line.contains("eval(")) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY", "Usage of eval() detected.", "Avoid eval() due to high security risks and performance penalties."));
                    qualityScore -= 30;
                }
                if (line.contains("console.log")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE", "Direct console.log usage detected.", "Remove console logs before deploying to production or use a logging framework."));
                    qualityScore -= 5;
                }
            }
        }

        qualityScore = Math.max(0, qualityScore);

        CodeAnalysis analysis = new CodeAnalysis();
        analysis.setFileName(fileName);
        analysis.setLanguage(language);
        analysis.setQualityScore(qualityScore);
        analysis.setTotalIssues(issues.size());
        analysis.setUserEmail(userEmail != null ? userEmail : "guest@devreview.com");
        analysis.setIssues(issues);

        for (AnalysisIssue issue : issues) {
            issue.setAnalysis(analysis);
        }

        return analysisRepository.save(analysis);
    }

    public String generateRefactoredCode(String language, String codeContent) {
        String[] lines = codeContent.split("\n");
        StringBuilder refactored = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();

            if ("Java".equalsIgnoreCase(language) && line.contains("System.out.println")) {
                line = line.replace("System.out.println(", "logger.info(");
            } else if ("Python".equalsIgnoreCase(language) && line.contains("print(")) {
                line = line.replace("print(", "logging.info(");
            } else if ("JavaScript".equalsIgnoreCase(language) && line.contains("console.log")) {
                line = line.replace("console.log(", "// logger.info(");
            }

            if ("JavaScript".equalsIgnoreCase(language) && line.contains("var ")) {
                line = line.replace("var ", "const ");
            }

            if (Pattern.compile("(?i).*?(api[_-]?key|secret|password|token)\\s*=\\s*['\"].+['\"].*").matcher(trimmed).matches()) {
                if ("Java".equalsIgnoreCase(language)) {
                    line = line.replaceAll("=\\s*['\"].+['\"]", "= System.getenv(\"API_KEY\")");
                } else if ("Python".equalsIgnoreCase(language)) {
                    line = line.replaceAll("=\\s*['\"].+['\"]", "= os.getenv('API_KEY')");
                } else if ("JavaScript".equalsIgnoreCase(language)) {
                    line = line.replaceAll("=\\s*['\"].+['\"]", "= process.env.API_KEY");
                }
            }

            if (line.contains("catch") && line.contains("{}")) {
                line = line.replace("{}", "{ logger.error(\"Error occurred\", e); }");
            } else if ("Python".equalsIgnoreCase(language) && trimmed.startsWith("except:")) {
                line = line.replace("except:", "except Exception as e:\n        logging.error(e)");
            }

            refactored.append(line).append("\n");
        }

        return refactored.toString().trim();
    }
}