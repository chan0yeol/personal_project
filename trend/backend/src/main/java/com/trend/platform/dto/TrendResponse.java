package com.trend.platform.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class TrendResponse {

    @Data @Builder
    public static class TimeSeriesDto {
        private String keyword;
        private String platform;
        private List<DataPoint> dataPoints;
        private Statistics statistics;
    }

    @Data @Builder
    public static class DataPoint {
        private LocalDate date;
        private BigDecimal normalizedScore;
        private Integer rawScore;
        private Integer newsMentionCount;
    }

    @Data @Builder
    public static class Statistics {
        private BigDecimal max;
        private BigDecimal min;
        private BigDecimal average;
        private LocalDate peakDate;
    }

    @Data @Builder
    public static class ComparisonDto {
        private List<String> keywords;
        private String platform;
        private String timeframe;
        /** key: 날짜, value: {키워드 -> 점수} */
        private List<Map<String, Object>> chartData;
        private Map<String, Statistics> statistics;
    }

    @Data @Builder
    public static class RankingDto {
        private String platform;
        private LocalDate rankDate;
        private List<RankItem> rankings;
    }

    @Data @Builder
    public static class RankItem {
        private Integer rank;
        private String keyword;
        private Integer rankChange;
        private BigDecimal score;
    }

    @Data @Builder
    public static class DashboardDto {
        private RankingDto googleRanking;
        private RankingDto naverRanking;
        private List<TimeSeriesDto> recentTrends;
        private String lastUpdated;
    }
}
