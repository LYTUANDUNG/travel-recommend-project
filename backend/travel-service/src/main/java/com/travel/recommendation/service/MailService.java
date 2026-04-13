package com.travel.recommendation.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.context.event.EventListener;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Random;

@Service
@Slf4j
public class MailService {

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final Random random = new Random();

    @Async
    @EventListener
    public void sendBlogNotification(BlogCreatedEvent event) {
        // This is kept for backward compatibility if needed, 
        // but now NewsletterService handles the bulk of it.
        log.info("BlogCreatedEvent received for: {}", event.getBlogTitle());
    }

    @Async
    public void sendEmail(String to, String subject, String content) {
        sendHtmlEmail(to, subject, content, false);
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String content) {
        sendHtmlEmail(to, subject, content, true);
    }

    private void sendHtmlEmail(String to, String subject, String content, boolean isHtml) {
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Simulating email to {}: {}", to, subject);
            return;
        }

        int attempts = 0;
        while (attempts < 3) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, isHtml);

                mailSender.send(message);
                log.info("Email to {} sent successfully on attempt {}", to, attempts + 1);
                return;
            } catch (Exception e) {
                attempts++;
                log.error("Failed to send email to {} on attempt {}, retrying...", to, attempts, e);
                try {
                    Thread.sleep(2000 + random.nextInt(1000));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        log.error("Mail failed after 3 retries for: {}", to);
    }
}
