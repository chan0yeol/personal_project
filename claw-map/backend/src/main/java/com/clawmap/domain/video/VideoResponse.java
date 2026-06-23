package com.clawmap.domain.video;

import com.clawmap.domain.spot.Spot;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
public class VideoResponse {

    private final Long id;
    private final String youtubeId;
    private final String title;
    private final String description;
    private final String thumbnailUrl;
    private final String youtubeUrl;
    private final LocalDateTime createdAt;
    private final List<LinkedSpot> spots;

    public VideoResponse(YoutubeVideo video, List<Spot> spots) {
        this.id = video.getId();
        this.youtubeId = video.getYoutubeId();
        this.title = video.getTitle();
        this.description = video.getDescription();
        this.thumbnailUrl = video.getThumbnailUrl();
        this.youtubeUrl = video.getYoutubeUrl();
        this.createdAt = video.getCreatedAt();
        this.spots = spots.stream().map(LinkedSpot::new).toList();
    }

    @Getter
    public static class LinkedSpot {
        private final Long id;
        private final String name;
        private final String address;
        private final Double lat;
        private final Double lng;

        public LinkedSpot(Spot spot) {
            this.id = spot.getId();
            this.name = spot.getName();
            this.address = spot.getAddress();
            this.lat = spot.getLat();
            this.lng = spot.getLng();
        }
    }
}
