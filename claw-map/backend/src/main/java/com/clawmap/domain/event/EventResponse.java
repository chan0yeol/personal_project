package com.clawmap.domain.event;

import lombok.Getter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
public class EventResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final String imageUrl;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final LocalDateTime createdAt;
    private final boolean active;
    private final long dday; // 양수: D-N(남은 날), 0: 오늘 마감, 음수: 종료

    public EventResponse(Event event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.content = event.getContent();
        this.imageUrl = event.getImageUrl();
        this.startDate = event.getStartDate();
        this.endDate = event.getEndDate();
        this.createdAt = event.getCreatedAt();
        this.active = event.isActive();
        this.dday = ChronoUnit.DAYS.between(LocalDate.now(), event.getEndDate());
    }
}
