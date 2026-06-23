package com.clawmap.domain.like;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    boolean existsByReviewIdAndDeviceId(Long reviewId, String deviceId);
    void deleteByReviewIdAndDeviceId(Long reviewId, String deviceId);

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
    void deleteByReviewIdAndUserId(Long reviewId, Long userId);

    long countByReviewId(Long reviewId);

    // 비로그인 공감 마이그레이션: deviceId 기반 공감 목록
    List<ReviewLike> findByDeviceIdAndUserIdIsNull(String deviceId);
}
