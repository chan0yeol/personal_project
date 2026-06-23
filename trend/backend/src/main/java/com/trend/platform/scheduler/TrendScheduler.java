package com.trend.platform.scheduler;

import com.trend.platform.entity.Keyword;
import com.trend.platform.entity.SearchConsoleData;
import com.trend.platform.repository.KeywordRepository;
import com.trend.platform.repository.SearchConsoleRepository;
import com.trend.platform.service.ScraperClientService;
import com.trend.platform.service.TrendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrendScheduler {

    private final TrendService trendService;
    private final KeywordRepository keywordRepository;
    private final ScraperClientService scraperClientService;
    private final SearchConsoleRepository gscRepository;

    @Value("${GSC_SITE_URL:}")
    private String gscSiteUrl;

    @Scheduled(cron = "0 0 3 * * *")
    public void collectGoogleTimeSeries() {
        log.info("[Scheduler] Starting daily Google Trends collection...");
        List<String> keywords = keywordRepository.findActiveKeywords().stream()
                .map(Keyword::getName).collect(Collectors.toList());
        if (!keywords.isEmpty()) {
            trendService.collectAndSaveGoogleTimeSeries(keywords);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void collectGoogleRealtime() {
        log.info("[Scheduler] Starting hourly Google Realtime collection...");
        trendService.collectAndSaveGoogleRealtime();
    }

    @Scheduled(cron = "0 30 * * * *")
    public void collectNaverRealtime() {
        log.info("[Scheduler] Starting hourly Naver Realtime collection...");
        trendService.collectAndSaveNaverRealtime();
    }

    @Scheduled(cron = "0 0 4 * * *")
    public void scheduleGscCollection() {
        if (gscSiteUrl == null || gscSiteUrl.isEmpty()) {
            log.warn("[GSC] GSC_SITE_URL is not configured.");
            return;
        }

        log.info("[GSC] Starting GSC collection for: {}", gscSiteUrl);
        scraperClientService.fetchSearchConsole(gscSiteUrl, 3)
            .subscribe(response -> {
                if (response != null && !"error".equalsIgnoreCase(response.getStatus())) {
                    List<SearchConsoleData> entities = response.getData().stream()
                        .map(item -> {
                            SearchConsoleData entity = new SearchConsoleData();
                            entity.setKeyword(item.getKeyword());
                            entity.setPage(item.getPage());
                            entity.setClicks(item.getClicks());
                            entity.setImpressions(item.getImpressions());
                            entity.setCtr(item.getCtr());
                            entity.setPosition(item.getPosition());
                            return entity;
                        }).toList();
                    gscRepository.saveAll(entities);
                    log.info("[GSC] Saved {} keywords.", entities.size());
                }
            });
    }
}