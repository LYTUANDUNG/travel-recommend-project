package com.travel.recommendation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Khôi phục mật khẩu - VinaTravel";
        // Update this URL to match your frontend reset page
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        String body = "Chào bạn,\n\n" +
                "Chúng tôi nhận được yêu cầu khôi phục mật khẩu của bạn.\n" +
                "Vui lòng nhấn vào đường dẫn bên dưới để thiết lập mật khẩu mới (đường dẫn có hiệu lực trong 30 phút):\n\n" +
                resetUrl + "\n\n" +
                "Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ VinaTravel";
        sendEmail(to, subject, body);
    }
}
