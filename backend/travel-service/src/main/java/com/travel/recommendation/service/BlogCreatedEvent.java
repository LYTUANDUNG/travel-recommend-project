package com.travel.recommendation.service;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class BlogCreatedEvent extends ApplicationEvent {
    
    private final String blogTitle;
    
    public BlogCreatedEvent(Object source, String blogTitle) {
        super(source);
        this.blogTitle = blogTitle;
    }
}
