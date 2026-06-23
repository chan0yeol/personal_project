package com.clawmap.domain.review;

import com.clawmap.domain.image.ReviewImage;

import java.time.LocalDateTime;
import java.util.List;

// 리뷰 응답 DTO - 이미지 URL + 좋아요 + 선택 항목 포함
public record ReviewResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        String content,
        List<String> imageUrls,
        long likeCount,
        boolean liked,
        LocalDateTime createdAt,
        Integer rating,
        Integer playCount,
        Integer spendAmount,
        Review.CatchResult catchResult,
        Review.MachineCondition machineCondition,
        Boolean revisit
) {
    public static ReviewResponse of(Review review, long likeCount, boolean liked, String profileImageUrl) {
        List<String> imageUrls = review.getImages().stream()
                .map(ReviewImage::getUrl)
                .toList();
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getNickname(),
                profileImageUrl,
                review.getContent(),
                imageUrls,
                likeCount,
                liked,
                review.getCreatedAt(),
                review.getRating(),
                review.getPlayCount(),
                review.getSpendAmount(),
                review.getCatchResult(),
                review.getMachineCondition(),
                review.getRevisit()
        );
    }
}
