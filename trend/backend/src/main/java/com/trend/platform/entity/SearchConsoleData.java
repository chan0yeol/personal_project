package com.trend.platform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "search_console_data")
public class SearchConsoleData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keyword;

    private String page;
    private Integer clicks;
    private Integer impressions;
    private Double ctr;
    private Double position;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @PrePersist
    public void prePersist() {
        this.collectedAt = LocalDateTime.now();
    }
}