package com.clawmap.domain.event;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventCommentRepository extends JpaRepository<EventComment, Long> {

    List<EventComment> findByEventIdOrderByCreatedAtAsc(Long eventId);

    void deleteByIdAndUserId(Long id, Long userId);
}
