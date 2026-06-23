package com.clawmap.domain.like;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final SpotLikeRepository spotLikeRepository;
    private final ReviewLikeRepository reviewLikeRepository;

    // 스팟 찜 토글 - 로그인 시 userId, 비로그인 시 deviceId 기준
    @Transactional
    public LikeResponse toggleSpotLike(Long spotId, String deviceId, Long userId) {
        if (userId != null) {
            if (spotLikeRepository.existsBySpotIdAndUserId(spotId, userId)) {
                spotLikeRepository.deleteBySpotIdAndUserId(spotId, userId);
            } else {
                spotLikeRepository.save(SpotLike.builder()
                        .spotId(spotId).deviceId(deviceId).userId(userId).build());
            }
        } else {
            if (spotLikeRepository.existsBySpotIdAndDeviceId(spotId, deviceId)) {
                spotLikeRepository.deleteBySpotIdAndDeviceId(spotId, deviceId);
            } else {
                spotLikeRepository.save(SpotLike.builder()
                        .spotId(spotId).deviceId(deviceId).build());
            }
        }
        return buildSpotLikeResponse(spotId, deviceId, userId);
    }

    // 리뷰 공감 토글
    @Transactional
    public LikeResponse toggleReviewLike(Long reviewId, String deviceId, Long userId) {
        if (userId != null) {
            if (reviewLikeRepository.existsByReviewIdAndUserId(reviewId, userId)) {
                reviewLikeRepository.deleteByReviewIdAndUserId(reviewId, userId);
            } else {
                reviewLikeRepository.save(ReviewLike.builder()
                        .reviewId(reviewId).deviceId(deviceId).userId(userId).build());
            }
        } else {
            if (reviewLikeRepository.existsByReviewIdAndDeviceId(reviewId, deviceId)) {
                reviewLikeRepository.deleteByReviewIdAndDeviceId(reviewId, deviceId);
            } else {
                reviewLikeRepository.save(ReviewLike.builder()
                        .reviewId(reviewId).deviceId(deviceId).build());
            }
        }
        return buildReviewLikeResponse(reviewId, deviceId, userId);
    }

    // 비로그인 찜/공감을 로그인 유저로 마이그레이션
    @Transactional
    public void migrateLikes(String deviceId, Long userId) {
        List<SpotLike> spotLikes = spotLikeRepository.findByDeviceIdAndUserIdIsNull(deviceId);
        for (SpotLike like : spotLikes) {
            if (!spotLikeRepository.existsBySpotIdAndUserId(like.getSpotId(), userId)) {
                spotLikeRepository.save(SpotLike.builder()
                        .spotId(like.getSpotId()).deviceId(deviceId).userId(userId).build());
            }
        }
        spotLikeRepository.deleteAll(spotLikes);

        List<ReviewLike> reviewLikes = reviewLikeRepository.findByDeviceIdAndUserIdIsNull(deviceId);
        for (ReviewLike like : reviewLikes) {
            if (!reviewLikeRepository.existsByReviewIdAndUserId(like.getReviewId(), userId)) {
                reviewLikeRepository.save(ReviewLike.builder()
                        .reviewId(like.getReviewId()).deviceId(deviceId).userId(userId).build());
            }
        }
        reviewLikeRepository.deleteAll(reviewLikes);
    }

    public LikeResponse getSpotLike(Long spotId, String deviceId, Long userId) {
        return buildSpotLikeResponse(spotId, deviceId, userId);
    }

    public LikeResponse getReviewLike(Long reviewId, String deviceId, Long userId) {
        return buildReviewLikeResponse(reviewId, deviceId, userId);
    }

    private LikeResponse buildSpotLikeResponse(Long spotId, String deviceId, Long userId) {
        boolean liked = userId != null
                ? spotLikeRepository.existsBySpotIdAndUserId(spotId, userId)
                : (deviceId != null && spotLikeRepository.existsBySpotIdAndDeviceId(spotId, deviceId));
        return new LikeResponse(liked, spotLikeRepository.countBySpotId(spotId));
    }

    private LikeResponse buildReviewLikeResponse(Long reviewId, String deviceId, Long userId) {
        boolean liked = userId != null
                ? reviewLikeRepository.existsByReviewIdAndUserId(reviewId, userId)
                : (deviceId != null && reviewLikeRepository.existsByReviewIdAndDeviceId(reviewId, deviceId));
        return new LikeResponse(liked, reviewLikeRepository.countByReviewId(reviewId));
    }
}
