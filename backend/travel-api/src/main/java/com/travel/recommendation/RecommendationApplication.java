package com.travel.recommendation;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RecommendationApplication {

	public static void main(String[] args) {
		// Load .env file from the current directory (backend/) or root
		try {
			Dotenv dotenv = Dotenv.configure()
				.directory("./") // Try local directory first
				.ignoreIfMalformed()
				.ignoreIfMissing()
				.load();
			
			dotenv.entries().forEach(entry -> {
				System.setProperty(entry.getKey(), entry.getValue());
			});
		} catch (Exception e) {
			// Ignore if failed, fallback to environment variables
		}

		SpringApplication.run(RecommendationApplication.class, args);
	}

}
