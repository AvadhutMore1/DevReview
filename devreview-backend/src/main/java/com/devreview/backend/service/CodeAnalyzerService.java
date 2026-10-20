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
        validateAnalysisInput(fileName, language, codeContent);
        List<AnalysisIssue> issues = new ArrayList<>();
        String[] lines = codeContent.split("\n");
        int qualityScore = 100;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            int lineNumber = i + 1;

            if (Pattern.compile("(?i).*?(api[_-]?key|secret|password|token|bearer)\\s*=\\s*['\"].+['\"].*").matcher(line).matches()) {
                issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY",
                        "Potential hardcoded secret or API key detected.",
                        "Store sensitive credentials in environment variables or a secret manager.",
                        "A credential is embedded as a string literal, so it can be exposed through source control, logs, or bundled artifacts.",
                        "An attacker could reuse the exposed credential to access systems or data; revoked credentials can also interrupt production integrations."));
                qualityScore -= 20;
            }

            if ("Java".equalsIgnoreCase(language)) {
                if (Pattern.compile("(?i).*?(SELECT|INSERT|UPDATE|DELETE).*?\\+.*?").matcher(line).matches()) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY",
                            "Possible SQL Injection vulnerability via string concatenation.",
                            "Use PreparedStatements or parameterized queries.",
                            "Untrusted input may be concatenated into SQL instead of being bound as data.",
                            "An attacker may alter the query to read, change, or delete database records, or bypass authorization checks."));
                    qualityScore -= 25;
                }
                if (line.contains("catch") && line.contains("{}")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX",
                            "Empty catch block silently ignores exceptions.",
                            "Log the exception with context or rethrow it for the caller to handle.",
                            "The catch block intercepts an exception but does not record it or provide recovery behavior.",
                            "Failures become difficult to diagnose and the program may continue with incomplete or inconsistent state."));
                    qualityScore -= 10;
                }
                if (line.contains("System.out.println")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE",
                            "Direct standard output usage detected.",
                            "Replace print statements with structured logging.",
                            "Diagnostic output is written directly to standard output rather than an application logging system.",
                            "Production logs may be noisy or unavailable to monitoring tools, slowing incident investigation."));
                    qualityScore -= 5;
                }
            } else if ("Python".equalsIgnoreCase(language)) {
                if (line.startsWith("except:") || line.startsWith("except Exception:")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX",
                            "Bare or overly broad exception catching detected.",
                            "Catch specific exception types (e.g., ValueError, KeyError).",
                            "The handler catches errors beyond the cases the code can safely recover from.",
                            "Programming errors can be hidden, leading to incorrect results and making failures harder to diagnose."));
                    qualityScore -= 10;
                }
                if (line.contains("eval(") || line.contains("exec(")) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY",
                            "Dynamic code execution via eval() or exec() detected.",
                            "Avoid eval()/exec(); parse input as data with a restricted parser.",
                            "Text is interpreted and executed as code instead of being handled as data.",
                            "If the input is attacker-controlled, arbitrary code may run with the application's permissions."));
                    qualityScore -= 30;
                }
                if (line.contains("print(")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE",
                            "Direct print() usage detected.",
                            "Use Python's built-in `logging` module for production code.",
                            "Diagnostic output is written directly to standard output instead of the application's logging system.",
                            "Production logs may be noisy or unavailable to monitoring tools, slowing incident investigation."));
                    qualityScore -= 5;
                }
            } else if ("JavaScript".equalsIgnoreCase(language)) {
                if (line.contains("var ")) {
                    issues.add(new AnalysisIssue(lineNumber, "WARNING", "SYNTAX",
                            "Legacy 'var' variable declaration detected.",
                            "Use 'const' or 'let' to ensure proper block scoping.",
                            "The declaration is function-scoped and may be redeclared or visible outside the intended block.",
                            "Unexpected variable reuse or scope leakage can produce hard-to-reproduce logic bugs."));
                    qualityScore -= 10;
                }
                if (line.contains("eval(")) {
                    issues.add(new AnalysisIssue(lineNumber, "CRITICAL", "SECURITY",
                            "Usage of eval() detected.",
                            "Avoid eval(); parse input as data with a restricted parser.",
                            "Text is interpreted and executed as JavaScript instead of being handled as data.",
                            "If the input is attacker-controlled, arbitrary code may run in the browser or server context."));
                    qualityScore -= 30;
                }
                if (line.contains("console.log")) {
                    issues.add(new AnalysisIssue(lineNumber, "INFO", "PERFORMANCE",
                            "Direct console.log usage detected.",
                            "Remove console logs before deploying to production or use a logging framework.",
                            "Diagnostic output is written directly to the console rather than a configurable logging system.",
                            "Logs can expose implementation details and make production monitoring harder."));
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
        validateAnalysisInput("source", language, codeContent);
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

    private void validateAnalysisInput(String fileName, String language, String codeContent) {
        if (fileName == null || fileName.isBlank() || fileName.length() > 255
                || fileName.matches(".*[\\\\/:*?\"<>|].*")
                || fileName.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("File name must be a valid name of 1 to 255 characters.");
        }
        if (language == null || !List.of("Java", "Python", "JavaScript").stream()
                .anyMatch(supported -> supported.equalsIgnoreCase(language.trim()))) {
            throw new IllegalArgumentException("Language must be Java, Python, or JavaScript.");
        }
        if (codeContent == null || codeContent.isBlank() || codeContent.length() > 100000) {
            throw new IllegalArgumentException("Source code is required and must be 100,000 characters or fewer.");
        }
    }
}