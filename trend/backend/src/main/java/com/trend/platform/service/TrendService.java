package com.trend.platform.service;

import com.trend.platform.dto.ScraperResponse;
import com.trend.platform.dto.TrendResponse;
import com.trend.platform.entity.DailyRank;
import com.trend.platform.entity.Keyword;
import com.trend.platform.entity.TrendData;
import com.trend.platform.entity.TrendData.Platform;
import com.trend.platform.repository.DailyRankRepository;
import com.trend.platform.repository.KeywordRepository;
import com.trend.platform.repository.TrendDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrendService {

    private final TrendDataRepository trendDataRepository;
    private final DailyRankRepository dailyRankRepository;
    private final KeywordRepository keywordRepository;
    private final TrendNormalizationService normalizationService;
    private final ScraperClientService scraperClientService;

    @Transactional
    public void collectAndSaveGoogleRealtime() {
        ScraperResponse.GoogleRealtime response = scraperClientService.fetchGoogleRealtime("KR").block();
        if (response == null || response.getTrending() == null || response.getTrending().isEmpty()) return;

        LocalDate today = LocalDate.now();
        dailyRankRepository.deleteByPlatformAndRankDate(Platform.GOOGLE, today);

        for (ScraperResponse.TrendingItem item : response.getTrending()) {
            String kwName = item.getKeyword() != null ? item.getKeyword() : item.getTitle();
            Keyword keyword = keywordRepository.findByName(kwName)
                    .orElseGet(() -> keywordRepository.save(Keyword.builder().name(kwName).isActive(true).build()));

            dailyRankRepository.save(DailyRank.builder()
                    .keyword(keyword).platform(Platform.GOOGLE)
                    .rankPosition(item.getRank() != null ? item.getRank() : 0)
                    .rankDate(today).rankChange(0).build());
        }
    }

    @Transactional
    public void collectAndSaveNaverRealtime() {
        ScraperResponse.NaverRealtime response = scraperClientService.fetchNaverRealtime().block();
        if (response == null || response.getTrending() == null || response.getTrending().isEmpty()) return;

        LocalDate today = LocalDate.now();
        dailyRankRepository.deleteByPlatformAndRankDate(Platform.NAVER, today);

        for (ScraperResponse.NaverRealtimeItem item : response.getTrending()) {
            if (item.getKeyword() == null || item.getKeyword().isBlank()) continue;
            Keyword keyword = keywordRepository.findByName(item.getKeyword())
                    .orElseGet(() -> keywordRepository.save(
                            Keyword.builder().name(item.getKeyword()).isActive(true).build()));
            dailyRankRepository.save(DailyRank.builder()
                    .keyword(keyword)
                    .platform(Platform.NAVER)
                    .rankPosition(item.getRank() != null ? item.getRank() : 0)
                    .rankDate(today)
                    .rankChange(0)
                    .build());
        }
        log.info("[NaverRealtime] Saved {} keywords", response.getTrending().size());
    }

    @Transactional
    public void collectAndSaveGoogleTimeSeries(List<String> keywords) {
        ScraperResponse.GoogleTrends response = scraperClientService.fetchGoogleTrends(keywords, "today 3-m", "KR").block();
        if (response == null || response.getData() == null || response.getData().isEmpty()) return;

        for (Map<String, Object> row : response.getData()) {
            String dateStr = (String) row.get("date");
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            for (String kw : keywords) {
                if (trendDataRepository.existsByKeywordNameAndPlatformAndRecordDate(kw, Platform.GOOGLE, date)) continue;
                Keyword keyword = keywordRepository.findByName(kw).orElseGet(() -> keywordRepository.save(Keyword.builder().name(kw).isActive(true).build()));
                Object val = row.get(kw);
                int rawScore = val != null ? ((Number) val).intValue() : 0;
                trendDataRepository.save(TrendData.builder().keyword(keyword).platform(Platform.GOOGLE).recordDate(date).rawScore(rawScore).normalizedScore(BigDecimal.valueOf(rawScore)).build());
            }
        }
    }

    @Transactional
    public void collectAndSaveNaverDatalab(List<String> keywords) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(90);
        ScraperResponse.GoogleTrends response = scraperClientService.fetchNaverDatalab(keywords, from.toString(), to.toString()).block();
        if (response == null || response.getData() == null || response.getData().isEmpty()) return;

        for (Map<String, Object> row : response.getData()) {
            LocalDate date = LocalDate.parse((String) row.get("date"));
            for (String kw : keywords) {
                if (trendDataRepository.existsByKeywordNameAndPlatformAndRecordDate(kw, Platform.NAVER, date)) continue;
                Keyword keyword = keywordRepository.findByName(kw).orElseGet(() -> keywordRepository.save(Keyword.builder().name(kw).isActive(true).build()));
                Object val = row.get(kw);
                trendDataRepository.save(TrendData.builder().keyword(keyword).platform(Platform.NAVER).recordDate(date).rawScore(val != null ? ((Number) val).intValue() : 0).normalizedScore(BigDecimal.valueOf(val != null ? ((Number) val).doubleValue() : 0)).build());
            }
        }
        buildRankingFromNaverDatalab(keywords);
    }

    @Transactional
    public void buildRankingFromNaverDatalab(List<String> keywords) {
        LocalDate today = LocalDate.now();
        List<String> uniqueKeywords = keywords.stream().distinct().collect(Collectors.toList());
        List<TrendData> recentData = trendDataRepository.findByKeywordsAndPlatformAndDateRange(uniqueKeywords, Platform.NAVER, today.minusDays(7), today);
        if (recentData.isEmpty()) return;

        Map<String, Double> avgScores = new HashMap<>();
        Map<String, Long> counts = new HashMap<>();
        for (TrendData d : recentData) {
            String kw = d.getKeyword().getName();
            avgScores.merge(kw, d.getNormalizedScore().doubleValue(), Double::sum);
            counts.merge(kw, 1L, Long::sum);
        }

        List<Map.Entry<String, Double>> sorted = avgScores.entrySet().stream()
                .map(e -> Map.entry(e.getKey(), e.getValue() / counts.getOrDefault(e.getKey(), 1L)))
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toList());

        dailyRankRepository.deleteByPlatformAndRankDate(Platform.NAVER, today);
        for (int i = 0; i < sorted.size(); i++) {
            Keyword keyword = keywordRepository.findByName(sorted.get(i).getKey()).orElse(null);
            if (keyword == null) continue;
            dailyRankRepository.save(DailyRank.builder().keyword(keyword).platform(Platform.NAVER).rankPosition(i + 1).rankDate(today).rankChange(0).build());
        }
    }

    @Transactional
    public void buildRankingFromTimeSeries() {
        LocalDate today = LocalDate.now();
        List<String> activeKeywords = keywordRepository.findActiveKeywords().stream().map(Keyword::getName).collect(Collectors.toList());
        if (activeKeywords.isEmpty()) return;

        List<TrendData> recentData = trendDataRepository.findByKeywordsAndPlatformAndDateRange(activeKeywords, Platform.GOOGLE, today.minusDays(7), today);
        if (recentData.isEmpty()) return;

        Map<String, BigDecimal> latestScores = new HashMap<>();
        for (TrendData d : recentData) {
            latestScores.merge(d.getKeyword().getName(), d.getNormalizedScore(), (v1, v2) -> v1.compareTo(v2) > 0 ? v1 : v2);
        }

        List<Map.Entry<String, BigDecimal>> sorted = latestScores.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toList());

        dailyRankRepository.deleteByPlatformAndRankDate(Platform.GOOGLE, today);
        for (int i = 0; i < sorted.size(); i++) {
            Keyword keyword = keywordRepository.findByName(sorted.get(i).getKey()).orElse(null);
            if (keyword != null) {
                dailyRankRepository.save(DailyRank.builder().keyword(keyword).platform(Platform.GOOGLE).rankPosition(i + 1).rankDate(today).rankChange(0).build());
            }
        }
    }

    @Cacheable(value = "trends")
    public TrendResponse.TimeSeriesDto getTimeSeries(String keyword, String platform, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days);
        Platform plt = Platform.valueOf(platform.toUpperCase());
        List<TrendData> dataList = trendDataRepository.findByKeywordAndPlatformAndDateRange(keyword, plt, from, to);
        return TrendResponse.TimeSeriesDto.builder().keyword(keyword).platform(platform).dataPoints(dataList.stream().map(d -> TrendResponse.DataPoint.builder().date(d.getRecordDate()).normalizedScore(d.getNormalizedScore()).rawScore(d.getRawScore()).build()).collect(Collectors.toList())).build();
    }

    @Cacheable(value = "trends")
    public TrendResponse.ComparisonDto compareKeywords(List<String> keywords, String platform, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days);
        Platform plt = Platform.valueOf(platform.toUpperCase());
        List<TrendData> allData = trendDataRepository.findByKeywordsAndPlatformAndDateRange(keywords, plt, from, to);
        Map<LocalDate, Map<String, BigDecimal>> byDate = new TreeMap<>();
        for (TrendData d : allData) {
            byDate.computeIfAbsent(d.getRecordDate(), k -> new HashMap<>()).put(d.getKeyword().getName(), d.getNormalizedScore());
        }
        List<Map<String, Object>> chartData = byDate.entrySet().stream().map(e -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", e.getKey().toString());
            row.putAll(e.getValue());
            return row;
        }).collect(Collectors.toList());
        return TrendResponse.ComparisonDto.builder().keywords(keywords).platform(platform).chartData(chartData).build();
    }

    @Cacheable(value = "rankings", key = "#platform")
    public TrendResponse.RankingDto getLatestRanking(String platform) {
        Platform plt = Platform.valueOf(platform.toUpperCase());
        List<DailyRank> ranks = dailyRankRepository.findLatestRankingByPlatform(plt);
        return TrendResponse.RankingDto.builder().platform(platform).rankDate(ranks.isEmpty() ? LocalDate.now() : ranks.get(0).getRankDate()).rankings(ranks.stream().map(r -> TrendResponse.RankItem.builder().rank(r.getRankPosition()).keyword(r.getKeyword().getName()).rankChange(r.getRankChange()).build()).collect(Collectors.toList())).build();
    }

    public TrendResponse.DashboardDto getDashboard() {
        List<String> activeKeywords = keywordRepository.findActiveKeywords().stream()
                .map(Keyword::getName).collect(Collectors.toList());

        List<TrendResponse.TimeSeriesDto> recentTrends = new ArrayList<>();
        if (!activeKeywords.isEmpty()) {
            List<String> topKeywords = activeKeywords.stream().limit(6).collect(Collectors.toList());
            for (String kw : topKeywords) {
                TrendResponse.TimeSeriesDto ts = getTimeSeries(kw, "GOOGLE", 7);
                if (ts.getDataPoints() != null && !ts.getDataPoints().isEmpty()) {
                    recentTrends.add(ts);
                }
            }
        }

        return TrendResponse.DashboardDto.builder()
                .googleRanking(getLatestRanking("GOOGLE"))
                .naverRanking(getLatestRanking("NAVER"))
                .recentTrends(recentTrends)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }
}