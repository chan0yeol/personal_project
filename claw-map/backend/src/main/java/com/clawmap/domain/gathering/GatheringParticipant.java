package com.clawmap.domain.gathering;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gathering_participants",
    uniqueConstraints = @UniqueConstraint(columnNames = {"gathering_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class GatheringParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gathering_id", nullable = false)
    private Long gatheringId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    void prePersist() {
        this.joinedAt = LocalDateTime.now();
    }
}
