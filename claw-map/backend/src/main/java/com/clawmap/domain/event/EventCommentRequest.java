package com.clawmap.domain.event;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class EventCommentRequest {

    @NotBlank
    private String content;
}
