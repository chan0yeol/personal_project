package com.clawmap.domain.spot;

import java.time.LocalDateTime;

public record GalleryImageResponse(
        String url,
        String type,        // SPOT | REVIEW
        Long reviewId,
        LocalDateTime createdAt
) {}
