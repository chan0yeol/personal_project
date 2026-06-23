package com.clawmap.domain.video;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface YoutubeVideoRepository extends JpaRepository<YoutubeVideo, Long> {
    boolean existsByYoutubeId(String youtubeId);
}
