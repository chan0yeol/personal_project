package com.clawmap.domain.image;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

    List<ReviewImage> findByReviewIdOrderByDisplayOrderAsc(Long reviewId);

    // 스팟 갤러리: 해당 스팟의 리뷰에 첨부된 이미지 모두 조회
    @Query("SELECT ri FROM ReviewImage ri WHERE ri.review.spot.id = :spotId ORDER BY ri.createdAt DESC")
    List<ReviewImage> findBySpotId(@Param("spotId") Long spotId);
}
