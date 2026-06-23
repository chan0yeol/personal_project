package com.clawmap.domain.image;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spot_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class SpotImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Spot과 OneToMany 없이 FK만 보관 (직렬화 문제 방지)
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    private String url;

    // 대표 이미지 여부 (첫 번째 이미지가 대표)
    private boolean main;

    private int displayOrder;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
