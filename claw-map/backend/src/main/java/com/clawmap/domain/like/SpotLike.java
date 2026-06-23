package com.clawmap.domain.like;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spot_likes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"spot_id", "device_id"}),
        // 로그인 유저는 userId 기준으로 중복 방지
        @UniqueConstraint(columnNames = {"spot_id", "user_id"})
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class SpotLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // 비로그인 식별자
    @Column(name = "device_id")
    private String deviceId;

    // 로그인 유저 ID (nullable)
    @Column(name = "user_id")
    private Long userId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
