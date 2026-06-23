package com.clawmap.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpotTagRepository extends JpaRepository<SpotTag, Long> {
    List<SpotTag> findBySpotIdOrderByCreatedAtAsc(Long spotId);
    boolean existsBySpotIdAndTag(Long spotId, String tag);
}
