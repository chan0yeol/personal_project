package com.trend.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "daily_ranks",
    uniqueConstraints = @UniqueConstraint(columnNames = {"keyword_id", "platform", "rank_date"}),
    indexes = @Index(name = "idx_rank_platform_date", columnList = "platform, rank_date")
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", nullable = false)
    private Keyword keyword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrendData.Platform platform;

    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition;

    @Column(name = "rank_date", nullable = false)
    private LocalDate rankDate;

    /** 전일 대비 순위 변동 (양수: 상승, 음수: 하락) */
    @Column(name = "rank_change")
    @Builder.Default
    private Integer rankChange = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
