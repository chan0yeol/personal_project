package com.clawmap.domain.user;

import com.clawmap.domain.like.SpotLikeRepository;
import com.clawmap.domain.review.Review;
import com.clawmap.domain.review.ReviewRepository;
import com.clawmap.domain.review.ReviewService;
import com.clawmap.domain.spot.Spot;
import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.spot.SpotService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SpotService spotService;
    private final SpotRepository spotRepository;
    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;
    private final SpotLikeRepository spotLikeRepository;
    private final UserRepository userRepository;

    // ── 마이페이지 목록 ───────────────────────────────────

    @GetMapping("/me/spots")
    public ResponseEntity<List<Spot>> mySpots(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(spotService.findByUserId(userId));
    }

    @GetMapping("/me/likes")
    public ResponseEntity<List<Spot>> myLikes(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        List<Long> spotIds = spotLikeRepository.findByUserId(userId)
                .stream().map(like -> like.getSpotId()).toList();
        return ResponseEntity.ok(spotRepository.findAllById(spotIds));
    }

    @GetMapping("/me/reviews")
    public ResponseEntity<List<MyReviewResponse>> myReviews(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        List<MyReviewResponse> result = reviewService.findByUserId(userId).stream()
                .map(r -> new MyReviewResponse(
                        r.getId(), r.getSpot().getId(),
                        r.getSpot().getName(), r.getSpot().getAddress(),
                        r.getSpot().getLat(), r.getSpot().getLng(),
                        r.getContent(), r.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/stats")
    public ResponseEntity<MyStatsResponse> myStats(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        long totalReviews   = reviewRepository.countByUserId(userId);
        long visitedSpots   = reviewRepository.countDistinctSpotsByUserId(userId);
        long totalPlayCount = reviewRepository.sumPlayCountByUserId(userId);
        long totalSpend     = reviewRepository.sumSpendAmountByUserId(userId);
        long successCount   = reviewRepository.countSuccessByUserId(userId);
        long catchTotal     = reviewRepository.countWithCatchResultByUserId(userId);
        long revisitTrue    = reviewRepository.countRevisitTrueByUserId(userId);
        long revisitTotal   = reviewRepository.countWithRevisitByUserId(userId);
        double catchRate  = catchTotal  > 0 ? Math.round(successCount * 1000.0 / catchTotal) / 10.0 : -1;
        double revisitRate = revisitTotal > 0 ? Math.round(revisitTrue * 1000.0 / revisitTotal) / 10.0 : -1;
        return ResponseEntity.ok(new MyStatsResponse(
                visitedSpots, totalReviews, totalPlayCount, totalSpend, catchRate, revisitRate));
    }

    // ── 닉네임 ──────────────────────────────────────────

    // 닉네임 중복 확인 (본인 제외)
    @GetMapping("/nickname-check")
    public ResponseEntity<Map<String, Boolean>> checkNickname(
            @RequestParam String nickname,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        boolean available = !userRepository.existsByNicknameAndIdNot(nickname.trim(), userId);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // 닉네임 변경 (2~12자, 중복 불가)
    @PatchMapping("/me/nickname")
    public ResponseEntity<Void> updateNickname(
            @RequestBody NicknameRequest request,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        String trimmed = request.nickname().trim();
        if (trimmed.length() < 2 || trimmed.length() > 12) {
            return ResponseEntity.badRequest().build();
        }
        if (userRepository.existsByNicknameAndIdNot(trimmed, userId)) {
            return ResponseEntity.status(409).build(); // 중복
        }
        User user = userRepository.findById(userId).orElseThrow();
        user.updateNickname(trimmed);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // ── 내부 DTO ─────────────────────────────────────────

    public record NicknameRequest(String nickname) {}

    public record MyReviewResponse(
            Long id, Long spotId,
            String spotName, String spotAddress,
            Double spotLat, Double spotLng,
            String content, LocalDateTime createdAt
    ) {}

    public record MyStatsResponse(
            long visitedSpotCount,
            long totalReviewCount,
            long totalPlayCount,
            long totalSpendAmount,
            double catchSuccessRate,   // -1 이면 데이터 없음
            double revisitRate         // -1 이면 데이터 없음
    ) {}
}
