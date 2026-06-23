package com.clawmap.domain.video;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "video_spot_links",
    uniqueConstraints = @UniqueConstraint(columnNames = {"video_id", "spot_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class VideoSpotLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "video_id", nullable = false)
    private Long videoId;

    @Column(name = "spot_id", nullable = false)
    private Long spotId;
}
