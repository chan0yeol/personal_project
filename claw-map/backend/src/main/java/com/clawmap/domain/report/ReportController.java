package com.clawmap.domain.report;

import com.clawmap.domain.review.ReviewRepository;
import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SpotRepository spotRepository;
    private final ReviewRepository reviewRepository;

    // 신고 등록
    @PostMapping
    public ResponseEntity<Void> createReport(@Valid @RequestBody ReportRequest request) {
        reportRepository.save(request.toEntity());
        return ResponseEntity.ok().build();
    }

    // 신고 목록 조회 (admin only)
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getReports(@AuthenticationPrincipal Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(403).build();

        List<ReportResponse> responses = reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(report -> new ReportResponse(report, resolveTargetSummary(report)))
                .toList();
        return ResponseEntity.ok(responses);
    }

    // 신고 삭제 (dismiss, admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismissReport(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(403).build();
        reportRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId).map(u -> u.isAdmin()).orElse(false);
    }

    private String resolveTargetSummary(Report report) {
        try {
            if (report.getTargetType() == Report.TargetType.SPOT) {
                return spotRepository.findById(report.getTargetId())
                        .map(s -> s.getName())
                        .orElse("(삭제된 스팟)");
            } else {
                return reviewRepository.findById(report.getTargetId())
                        .map(r -> r.getContent().length() > 50
                                ? r.getContent().substring(0, 50) + "…"
                                : r.getContent())
                        .orElse("(삭제된 리뷰)");
            }
        } catch (Exception e) {
            return "(조회 불가)";
        }
    }
}
