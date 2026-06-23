package com.clawmap.domain.gathering;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GatheringRepository extends JpaRepository<Gathering, Long> {
    List<Gathering> findBySpotIdAndStatusNotOrderByMeetAtAsc(Long spotId, Gathering.Status status);
    List<Gathering> findByStatusNotOrderByMeetAtAsc(Gathering.Status status);
}
