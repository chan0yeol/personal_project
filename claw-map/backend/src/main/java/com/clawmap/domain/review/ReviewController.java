package com.clawmap.domain.review;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spots/{spotId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 리뷰 목록 (공감 정보 포함)
    @GetMapping
    public List<ReviewResponse> getReviews(
            @PathVariable Long spotId,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @AuthenticationPrincipal Long userId) {
        return reviewService.findBySpotId(spotId, deviceId, userId);
    }

    // 리뷰 등록 - 로그인 시 userId 저장
    @PostMapping
    public ResponseEntity<Void> createReview(
            @PathVariable Long spotId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal Long userId) {
        reviewService.save(spotId, request, userId);
        return ResponseEntity.ok().build();
    }

    // 리뷰 삭제 - 본인 리뷰만 가능 (로그인 필요)
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long spotId,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        reviewService.delete(reviewId, userId);
        return ResponseEntity.ok().build();
    }
}
