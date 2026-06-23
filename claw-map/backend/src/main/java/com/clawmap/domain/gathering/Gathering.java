package com.clawmap.domain.gathering;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gatherings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Gathering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long spotId;

    @Column(nullable = false)
    private Long hostUserId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime meetAt;

    // null이면 인원 제한 없음
    private Integer maxParticipants;

    @Column(nullable = false)
    private Boolean isRecurring;

    @Enumerated(EnumType.STRING)
    private RecurrenceType recurrenceType;

    // 요일(0~6) 또는 날짜(1~31)
    private Integer recurrenceDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = Status.CANCELLED;
    }

    public enum RecurrenceType { WEEKLY, MONTHLY }
    public enum Status { OPEN, CLOSED, CANCELLED }
}
