package com.travel.recommendation;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RecommendationApplication {

	public static void main(String[] args) {
		// Load .env file from various possible locations
		try {
			String[] paths = {"./", "../", "./backend", "../backend"};
			for (String path : paths) {
				java.io.File file = new java.io.File(path, ".env");
				if (file.exists()) {
					Dotenv dotenv = Dotenv.configure()
						.directory(path)
						.ignoreIfMalformed()
						.ignoreIfMissing()
						.load();
					
					dotenv.entries().forEach(entry -> {
						System.setProperty(entry.getKey(), entry.getValue());
					});
					System.out.println("Dotenv: Loaded environment variables from " + file.getAbsolutePath());
					break;
				}
			}
		} catch (Exception e) {
			System.err.println("Dotenv: Failed to load .env file: " + e.getMessage());
		}

		SpringApplication.run(RecommendationApplication.class, args);
	}

}
