package com.clawmap.domain.like;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    // 스팟 찜 토글 - 로그인 시 userId도 함께 전달
    @PostMapping("/api/spots/{id}/like")
    public ResponseEntity<LikeResponse> toggleSpotLike(
            @PathVariable Long id,
            @RequestHeader("X-Device-Id") String deviceId,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(likeService.toggleSpotLike(id, deviceId, userId));
    }

    // 리뷰 공감 토글
    @PostMapping("/api/reviews/{id}/like")
    public ResponseEntity<LikeResponse> toggleReviewLike(
            @PathVariable Long id,
            @RequestHeader("X-Device-Id") String deviceId,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(likeService.toggleReviewLike(id, deviceId, userId));
    }
}
