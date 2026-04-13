package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Tag;
import com.travel.recommendation.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    @Transactional(readOnly = true)
    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Tag> getTagById(Long id) {
        return tagRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Tag> getTagByName(String name) {
        return tagRepository.findByName(name);
    }

    @Transactional
    public Tag saveTag(Tag tag) {
        return tagRepository.save(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        tagRepository.deleteById(id);
    }
}
