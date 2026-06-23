package com.clawmap.domain.spot;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpotSuggestionRepository extends JpaRepository<SpotSuggestion, Long> {
    List<SpotSuggestion> findByStatusOrderByCreatedAtDesc(SpotSuggestion.Status status);
}
