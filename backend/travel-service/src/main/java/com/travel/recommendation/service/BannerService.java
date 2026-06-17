package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Banner;
import com.travel.recommendation.adapter.out.persistence.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    @Cacheable(value = "banners", key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public List<Banner> getAllBanners() {
        return bannerRepository.findAll();
    }

    @Cacheable(value = "banners", key = "'active'", sync = true)
    @Transactional(readOnly = true)
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    @CacheEvict(value = "banners", allEntries = true)
    @Transactional
    public Banner saveBanner(Banner banner) {
        return bannerRepository.save(banner);
    }

    @CacheEvict(value = "banners", allEntries = true)
    @Transactional
    public void deleteBanner(Long id) {
        bannerRepository.deleteById(id);
    }
}
