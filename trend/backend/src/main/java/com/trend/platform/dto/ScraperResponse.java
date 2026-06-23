package com.trend.platform.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ScraperResponse {

    @Data
    public static class GoogleTrends {
        private List<String> keywords;
        private List<Map<String, Object>> data;
    }

    @Data
    public static class GoogleRealtime {
        private List<TrendingItem> trending;
    }

    @Data
    public static class TrendingItem {
        private String keyword; // 기존 코드에서 keyword를 참조하므로 title을 keyword로 변경하거나 추가
        private String title;
        private Integer rank;   // 기존 코드에서 getRank()를 참조하므로 추가
        private String count;
        private List<String> articles;
    }

    @Data
    public static class NaverNews {
        private String keyword;
        private Integer totalCount;
        private List<NewsArticle> articles;
    }

    @Data
    public static class NewsArticle {
        private String title;
        private String link;
        private String description;
        private String pubDate;
    }

    @Data
    public static class NaverRealtime {
        private List<NaverRealtimeItem> trending;
        private Integer total;
        private String collectedAt;
    }

    @Data
    public static class NaverRealtimeItem {
        private Integer rank;
        private String keyword;
    }

    @Data
    public static class GoogleSearchConsole {
        private String status;
        private List<GscItem> data;
    }

    @Data
    public static class GscItem {
        private String keyword;
        private String page;
        private Integer clicks;
        private Integer impressions;
        private Double ctr;
        private Double position;
    }
}