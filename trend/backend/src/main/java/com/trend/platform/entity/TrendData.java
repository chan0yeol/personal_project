package com.trend.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "trend_data",
    indexes = {
        @Index(name = "idx_trend_keyword_date", columnList = "keyword_id, record_date"),
        @Index(name = "idx_trend_platform_date", columnList = "platform, record_date")
    }
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrendData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", nullable = false)
    private Keyword keyword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Platform platform;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    /**
     * 정규화된 관심도 지수 (0.0 ~ 100.0).
     * Google과 Naver의 기준이 달라 표준화 처리 후 저장.
     */
    @Column(name = "normalized_score", precision = 6, scale = 2)
    private BigDecimal normalizedScore;

    /** 플랫폼 원본 값 (0~100) */
    @Column(name = "raw_score")
    private Integer rawScore;

    @Column(name = "news_mention_count")
    @Builder.Default
    private Integer newsMentionCount = 0;

    @Column(name = "sentiment_score", precision = 4, scale = 2)
    private BigDecimal sentimentScore;

    @CreationTimestamp
    @Column(name = "collected_at", updatable = false)
    private LocalDateTime collectedAt;

    public enum Platform {
        GOOGLE, NAVER, YOUTUBE
    }
}
