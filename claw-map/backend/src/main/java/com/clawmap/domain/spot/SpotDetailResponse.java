package com.clawmap.domain.spot;

import com.clawmap.domain.image.SpotImage;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// 스팟 상세 응답 DTO - 이미지 URL + 좋아요 정보 포함
@Getter
public class SpotDetailResponse {

    private final Long id;
    private final String name;
    private final String address;
    private final Double lat;
    private final Double lng;
    private final Boolean parking;
    private final Boolean coin500;
    private final Boolean coin1000;
    private final Spot.Difficulty difficulty;
    private final String openTime;
    private final LocalDateTime createdAt;
    private final Long userId;
    private final List<String> imageUrls;
    private final long likeCount;
    private final boolean liked;
    private final long reviewCount;
    private final double avgRating;

    public SpotDetailResponse(Spot spot, List<SpotImage> images, long likeCount, boolean liked) {
        this(spot, images, likeCount, liked, 0, 0.0);
    }

    public SpotDetailResponse(Spot spot, List<SpotImage> images, long likeCount, boolean liked, long reviewCount, double avgRating) {
        this.id = spot.getId();
        this.name = spot.getName();
        this.address = spot.getAddress();
        this.lat = spot.getLat();
        this.lng = spot.getLng();
        this.parking = spot.getParking();
        this.coin500 = spot.getCoin500();
        this.coin1000 = spot.getCoin1000();
        this.difficulty = spot.getDifficulty();
        this.openTime = spot.getOpenTime();
        this.createdAt = spot.getCreatedAt();
        this.userId = spot.getUserId();
        this.imageUrls = images.stream().map(SpotImage::getUrl).toList();
        this.likeCount = likeCount;
        this.liked = liked;
        this.reviewCount = reviewCount;
        this.avgRating = avgRating;
    }
}
