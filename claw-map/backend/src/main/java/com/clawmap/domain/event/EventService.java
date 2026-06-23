package com.clawmap.domain.event;

import com.clawmap.domain.user.User;
import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final EventCommentRepository eventCommentRepository;
    private final UserRepository userRepository;

    public List<EventResponse> findAll() {
        return eventRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(EventResponse::new).toList();
    }

    public EventResponse findById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이벤트입니다."));
        return new EventResponse(event);
    }

    @Transactional
    public EventResponse create(EventRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        if (!user.isAdmin()) {
            throw new IllegalStateException("관리자만 이벤트를 등록할 수 있습니다.");
        }
        Event event = eventRepository.save(Event.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .userId(userId)
                .build());
        return new EventResponse(event);
    }

    @Transactional
    public EventResponse update(Long eventId, EventRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        if (!user.isAdmin()) {
            throw new IllegalStateException("관리자만 이벤트를 수정할 수 있습니다.");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이벤트입니다."));
        event.update(request.getTitle(), request.getContent(), request.getImageUrl(),
                request.getStartDate(), request.getEndDate());
        return new EventResponse(event);
    }

    @Transactional
    public void delete(Long eventId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        if (!user.isAdmin()) {
            throw new IllegalStateException("관리자만 이벤트를 삭제할 수 있습니다.");
        }
        eventRepository.deleteById(eventId);
    }

    public List<EventComment> findComments(Long eventId) {
        return eventCommentRepository.findByEventIdOrderByCreatedAtAsc(eventId);
    }

    @Transactional
    public EventComment addComment(Long eventId, EventCommentRequest request, Long userId) {
        String nickname = userRepository.findById(userId)
                .map(u -> u.getNickname() != null ? u.getNickname() : u.getEmail())
                .orElse("익명");
        return eventCommentRepository.save(EventComment.builder()
                .eventId(eventId)
                .userId(userId)
                .nickname(nickname)
                .content(request.getContent())
                .build());
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        eventCommentRepository.deleteByIdAndUserId(commentId, userId);
    }
}
