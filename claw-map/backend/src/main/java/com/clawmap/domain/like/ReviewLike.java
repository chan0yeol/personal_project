package com.clawmap.domain.like;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_likes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"review_id", "device_id"}),
        @UniqueConstraint(columnNames = {"review_id", "user_id"})
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ReviewLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_id", nullable = false)
    private Long reviewId;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
