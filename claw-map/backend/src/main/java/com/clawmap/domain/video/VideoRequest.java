package com.clawmap.domain.video;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.util.List;

@Getter
public class VideoRequest {

    @NotBlank
    private String youtubeId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private List<Long> spotIds;
}
