package com.clawmap.domain.gathering;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GatheringParticipantRepository extends JpaRepository<GatheringParticipant, Long> {
    boolean existsByGatheringIdAndUserId(Long gatheringId, Long userId);
    void deleteByGatheringIdAndUserId(Long gatheringId, Long userId);
    long countByGatheringId(Long gatheringId);
    List<GatheringParticipant> findByGatheringId(Long gatheringId);
}
