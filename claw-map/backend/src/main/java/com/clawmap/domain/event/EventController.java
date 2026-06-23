package com.clawmap.domain.event;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // 이벤트 목록
    @GetMapping
    public List<EventResponse> getEvents() {
        return eventService.findAll();
    }

    // 이벤트 상세
    @GetMapping("/{id}")
    public EventResponse getEvent(@PathVariable Long id) {
        return eventService.findById(id);
    }

    // 이벤트 등록 (admin only)
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(eventService.create(request, userId));
    }

    // 이벤트 수정 (admin only)
    @PatchMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(eventService.update(id, request, userId));
    }

    // 이벤트 삭제 (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        eventService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    // 댓글 목록
    @GetMapping("/{id}/comments")
    public List<EventComment> getComments(@PathVariable Long id) {
        return eventService.findComments(id);
    }

    // 댓글 작성 (로그인 필요)
    @PostMapping("/{id}/comments")
    public ResponseEntity<EventComment> addComment(
            @PathVariable Long id,
            @Valid @RequestBody EventCommentRequest request,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(eventService.addComment(id, request, userId));
    }

    // 댓글 삭제 (본인만)
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long userId) {
        eventService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
