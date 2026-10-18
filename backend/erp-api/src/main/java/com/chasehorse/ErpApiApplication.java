package com.chasehorse;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ErpApiApplication {
    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(ErpApiApplication.class, args);
    }

    private static void loadDotenv() {
        List<Path> candidatePaths = List.of(
            Path.of(".env"),
            Path.of("backend/erp-api/.env"),
            Path.of("../backend/erp-api/.env")
        );
        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                try {
                    for (String line : Files.readAllLines(path)) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                            int eqIdx = line.indexOf('=');
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}