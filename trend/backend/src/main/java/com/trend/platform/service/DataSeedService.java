package com.trend.platform.service;

import com.trend.platform.entity.Keyword;
import com.trend.platform.repository.KeywordRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataSeedService {

    private final KeywordRepository keywordRepository;
    private final TrendService trendService;

    private static final List<String> DEFAULT_KEYWORDS = List.of(
            "ChatGPT", "AI", "삼성", "현대", "카카오",
            "네이버", "애플", "테슬라", "비트코인", "주식"
    );

    @PostConstruct
    @Transactional
    public void seedDefaultKeywords() {
        int seeded = 0;
        for (String name : DEFAULT_KEYWORDS) {
            if (keywordRepository.findByName(name).isEmpty()) {
                keywordRepository.save(
                        Keyword.builder().name(name).category("default").isActive(true).build()
                );
                seeded++;
            }
        }
        if (seeded > 0) {
            log.info("[Seed] 기본 키워드 {}개 등록 완료", seeded);
            // 앱 시작 시 즉시 데이터 수집
            new Thread(() -> {
                try {
                    Thread.sleep(5000); // 컨텍스트 완전 로드 대기
                    trendService.collectAndSaveGoogleTimeSeries(DEFAULT_KEYWORDS.subList(0, 5));
                    Thread.sleep(2000);
                    trendService.collectAndSaveGoogleTimeSeries(DEFAULT_KEYWORDS.subList(5, 10));
                    trendService.buildRankingFromTimeSeries();
                    Thread.sleep(2000);
                    trendService.collectAndSaveNaverDatalab(DEFAULT_KEYWORDS.subList(0, 5));
                    Thread.sleep(2000);
                    trendService.collectAndSaveNaverDatalab(DEFAULT_KEYWORDS.subList(5, 10));
                } catch (Exception e) {
                    log.error("[Seed] 초기 데이터 수집 실패: {}", e.getMessage());
                }
            }).start();
        }
    }
}
