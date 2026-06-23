package com.clawmap.domain.admin;

import com.clawmap.domain.gathering.Gathering;
import com.clawmap.domain.gathering.GatheringRepository;
import com.clawmap.domain.report.ReportRepository;
import com.clawmap.domain.review.ReviewRepository;
import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.spot.SpotSuggestion;
import com.clawmap.domain.spot.SpotSuggestionRepository;
import com.clawmap.domain.user.UserRepository;
import com.clawmap.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final SpotRepository spotRepository;
    private final ReviewRepository reviewRepository;
    private final ReportRepository reportRepository;
    private final GatheringRepository gatheringRepository;
    private final SpotSuggestionRepository suggestionRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats(@AuthenticationPrincipal Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(403).build();

        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long totalSpots = spotRepository.count();
        long totalUsers = userRepository.count();
        long pendingReports = reportRepository.count();

        List<?> reviews = reviewRepository.findAll();
        long totalReviews = reviews.size();

        // 평균 별점 (rating null 제외)
        double avgRating = reviewRepository.findAll().stream()
                .filter(r -> r.getRating() != null)
                .mapToInt(r -> r.getRating())
                .average()
                .orElse(0.0);

        long newSpotsThisMonth = spotRepository.countByCreatedAtAfter(monthStart);
        long newReviewsThisMonth = reviewRepository.countByCreatedAtAfter(monthStart);

        long activeGatherings = gatheringRepository
                .findByStatusNotOrderByMeetAtAsc(Gathering.Status.CANCELLED)
                .stream()
                .filter(g -> g.getStatus() == Gathering.Status.OPEN && g.getMeetAt().isAfter(now))
                .count();

        return ResponseEntity.ok(AdminStatsResponse.builder()
                .totalSpots(totalSpots)
                .totalReviews(totalReviews)
                .avgRating(Math.round(avgRating * 10.0) / 10.0)
                .totalUsers(totalUsers)
                .newSpotsThisMonth(newSpotsThisMonth)
                .newReviewsThisMonth(newReviewsThisMonth)
                .pendingReports(pendingReports)
                .activeGatherings(activeGatherings)
                .build());
    }

    // 수정 제안 목록 (PENDING)
    @GetMapping("/suggestions")
    public ResponseEntity<List<SpotSuggestion>> getSuggestions(@AuthenticationPrincipal Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(suggestionRepository.findByStatusOrderByCreatedAtDesc(SpotSuggestion.Status.PENDING));
    }

    // 수정 제안 처리 (DONE / REJECTED)
    @PatchMapping("/suggestions/{id}")
    public ResponseEntity<Void> updateSuggestion(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(403).build();
        suggestionRepository.findById(id).ifPresent(s ->
            s.updateStatus(SpotSuggestion.Status.valueOf(body.get("status")))
        );
        return ResponseEntity.ok().build();
    }

    private boolean isAdmin(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId).map(User::isAdmin).orElse(false);
    }
}
