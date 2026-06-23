package com.clawmap.domain.gathering;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class GatheringCommentRequest {

    @NotBlank
    private String content;
}
