package com.clawmap.domain.spot;

import com.clawmap.domain.image.ReviewImageRepository;
import com.clawmap.domain.image.SpotImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GalleryService {

    private final SpotImageRepository spotImageRepository;
    private final ReviewImageRepository reviewImageRepository;

    public List<GalleryImageResponse> findBySpotId(Long spotId) {
        List<GalleryImageResponse> result = new ArrayList<>();

        // 스팟 등록 이미지 (등록 순)
        spotImageRepository.findBySpotIdOrderByDisplayOrderAsc(spotId).forEach(img ->
                result.add(new GalleryImageResponse(img.getUrl(), "SPOT", null, img.getCreatedAt())));

        // 리뷰 첨부 이미지 (최신순)
        reviewImageRepository.findBySpotId(spotId).forEach(img ->
                result.add(new GalleryImageResponse(img.getUrl(), "REVIEW",
                        img.getReview().getId(), img.getCreatedAt())));

        return result;
    }
}
