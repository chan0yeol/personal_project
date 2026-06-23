package com.clawmap.domain.video;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VideoSpotLinkRepository extends JpaRepository<VideoSpotLink, Long> {
    List<VideoSpotLink> findByVideoId(Long videoId);
    List<VideoSpotLink> findBySpotId(Long spotId);
    void deleteByVideoId(Long videoId);
}
