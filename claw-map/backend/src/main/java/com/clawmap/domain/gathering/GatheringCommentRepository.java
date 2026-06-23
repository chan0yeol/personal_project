package com.clawmap.domain.gathering;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GatheringCommentRepository extends JpaRepository<GatheringComment, Long> {
    List<GatheringComment> findByGatheringIdOrderByCreatedAtAsc(Long gatheringId);
    void deleteByIdAndUserId(Long id, Long userId);
}
