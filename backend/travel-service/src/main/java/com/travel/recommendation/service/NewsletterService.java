package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Blog;
import com.travel.recommendation.domain.entity.NewsletterSubscriber;
import com.travel.recommendation.adapter.out.persistence.NewsletterSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final NewsletterSubscriberRepository subscriberRepository;
    private final MailService mailService;

    @Transactional
    public void subscribe(String email) {
        if (subscriberRepository.findByEmail(email).isPresent()) {
            NewsletterSubscriber subscriber = subscriberRepository.findByEmail(email).get();
            if (!subscriber.getIsActive()) {
                subscriber.setIsActive(true);
                subscriberRepository.save(subscriber);
            }
            return;
        }

        NewsletterSubscriber subscriber = NewsletterSubscriber.builder()
                .email(email)
                .subscribedAt(LocalDateTime.now())
                .isActive(true)
                .build();
        subscriberRepository.save(subscriber);
        
        // Send Welcome Email
        mailService.sendEmail(email, "Chào mừng bạn đến với Cẩm nang Du lịch!", 
            "Cảm ơn bạn đã đăng ký nhận tin từ chúng tôi. Bạn sẽ nhận được những gợi ý du lịch mới nhất hàng tuần!");
    }

    @Transactional(readOnly = true)
    public boolean isSubscribed(String email) {
        return subscriberRepository.findByEmail(email)
                .map(NewsletterSubscriber::getIsActive)
                .orElse(false);
    }

    @Transactional
    public void unsubscribe(String email) {
        subscriberRepository.findByEmail(email).ifPresent(subscriber -> {
            subscriber.setIsActive(false);
            subscriberRepository.save(subscriber);
        });
    }

    @Async
    public void notifySubscribers(Blog blog) {
        List<NewsletterSubscriber> activeSubscribers = subscriberRepository.findByIsActiveTrue();
        
        for (NewsletterSubscriber subscriber : activeSubscribers) {
            try {
                log.info("Sending newsletter notification for blog {} to {}", blog.getTitle(), subscriber.getEmail());
                mailService.sendEmail(
                    subscriber.getEmail(),
                    "Bản tin du lịch mới: " + blog.getTitle(),
                    "Chào bạn,\n\nMột bài viết mới vừa được đăng tải: " + blog.getTitle() 
                    + "\n\n" + blog.getExcerpt()
                    + "\n\nXem thêm tại: http://localhost:5173/blog/" + blog.getId()
                );
                log.info("Successfully sent newsletter to {}", subscriber.getEmail());
            } catch (Exception e) {
                log.error("Failed to send newsletter to {}", subscriber.getEmail(), e);
            }
        }
    }
}
