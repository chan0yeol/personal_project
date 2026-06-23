package com.clawmap.domain.gathering;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class GatheringRequest {

    @NotNull
    private Long spotId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private LocalDateTime meetAt;

    // null이면 인원 제한 없음
    private Integer maxParticipants;

    @NotNull
    private Boolean isRecurring;

    private Gathering.RecurrenceType recurrenceType;

    private Integer recurrenceDay;
}
