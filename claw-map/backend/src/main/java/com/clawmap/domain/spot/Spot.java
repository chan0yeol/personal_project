package com.clawmap.domain.spot;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Spot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    private Boolean parking;

    private Boolean coin500;

    private Boolean coin1000;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private String openTime;

    // 로그인 유저가 등록한 경우 userId 저장 (비로그인 시 null)
    @Column(name = "user_id")
    private Long userId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void update(String name, String address, Boolean parking, Boolean coin500,
                        Boolean coin1000, Difficulty difficulty, String openTime) {
        this.name = name;
        this.address = address;
        this.parking = parking;
        this.coin500 = coin500;
        this.coin1000 = coin1000;
        this.difficulty = difficulty;
        this.openTime = openTime;
    }

    public enum Difficulty {
        EASY, NORMAL, HARD
    }
}
