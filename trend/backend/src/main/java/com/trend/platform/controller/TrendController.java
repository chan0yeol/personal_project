package com.trend.platform.controller;

import com.trend.platform.dto.TrendResponse;
import com.trend.platform.entity.Keyword;
import com.trend.platform.repository.KeywordRepository;
import com.trend.platform.scheduler.TrendScheduler;
import com.trend.platform.service.TrendService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/trends")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = "${frontend.url:http://localhost:3000}")
public class TrendController {

    private final TrendService trendService;
    private final KeywordRepository keywordRepository;
    private final TrendScheduler trendScheduler;

    /**
     * 대시보드 전체 데이터 (랭킹 + 최근 트렌드).
     */
    @GetMapping("/dashboard")
    public ResponseEntity<TrendResponse.DashboardDto> getDashboard() {
        return ResponseEntity.ok(trendService.getDashboard());
    }

    /**
     * 특정 키워드 시계열 데이터.
     */
    @GetMapping("/timeseries")
    public ResponseEntity<TrendResponse.TimeSeriesDto> getTimeSeries(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "GOOGLE") String platform,
            @RequestParam(defaultValue = "30") @Min(7) @Max(90) int days
    ) {
        return ResponseEntity.ok(trendService.getTimeSeries(keyword, platform, days));
    }

    /**
     * 키워드 비교 분석.
     */
    @GetMapping("/compare")
    public ResponseEntity<TrendResponse.ComparisonDto> compareKeywords(
            @RequestParam @Size(min = 2, max = 5) List<String> keywords,
            @RequestParam(defaultValue = "GOOGLE") String platform,
            @RequestParam(defaultValue = "30") @Min(7) @Max(90) int days
    ) {
        return ResponseEntity.ok(trendService.compareKeywords(keywords, platform, days));
    }

    /**
     * 플랫폼별 최신 랭킹.
     */
    @GetMapping("/ranking")
    public ResponseEntity<TrendResponse.RankingDto> getRanking(
            @RequestParam(defaultValue = "GOOGLE") String platform
    ) {
        return ResponseEntity.ok(trendService.getLatestRanking(platform));
    }

    /**
     * 키워드 등록 (스케줄러 추적 대상 추가).
     */
    @PostMapping("/keywords")
    public ResponseEntity<Map<String, Object>> addKeyword(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "keyword name is required"));
        }

        Keyword keyword = keywordRepository.findByName(name)
                .orElseGet(() -> keywordRepository.save(
                        Keyword.builder()
                                .name(name)
                                .category(body.getOrDefault("category", "general"))
                                .isActive(true)
                                .build()
                ));

        return ResponseEntity.ok(Map.of(
                "id", keyword.getId(),
                "name", keyword.getName(),
                "created", keyword.getCreatedAt() != null ? keyword.getCreatedAt().toString() : ""
        ));
    }

    /**
     * 활성 키워드 목록 조회.
     */
    @GetMapping("/keywords")
    public ResponseEntity<List<Keyword>> getKeywords() {
        return ResponseEntity.ok(keywordRepository.findActiveKeywords());
    }

    /**
     * 수동 데이터 수집 트리거 (개발/테스트용).
     */
    @PostMapping("/collect/trigger")
    public ResponseEntity<Map<String, String>> triggerCollect() {
        trendScheduler.collectGoogleTimeSeries();
        return ResponseEntity.ok(Map.of(
                "status", "triggered",
                "message", "키워드 시계열 수집 및 순위 생성을 시작했습니다. 약 1~2분 소요됩니다."
        ));
    }

    /**
     * 실시간 순위 즉시 수집 트리거 (개발/테스트용).
     */
    @PostMapping("/collect/trigger/realtime")
    public ResponseEntity<Map<String, String>> triggerRealtime() {
        trendScheduler.collectGoogleRealtime();
        return ResponseEntity.ok(Map.of(
                "status", "triggered",
                "message", "Google 실시간 트렌드 수집 및 순위 재계산을 시작했습니다."
        ));
    }
}
