package com.clawmap.domain.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.time.LocalDate;

@Getter
public class EventRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String imageUrl;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
