package com.clawmap.domain.gathering;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gatherings")
@RequiredArgsConstructor
public class GatheringController {

    private final GatheringService gatheringService;

    // 모임 목록 (spotId 있으면 스팟별, 없으면 전체)
    @GetMapping
    public List<GatheringResponse> getGatherings(
            @RequestParam(required = false) Long spotId,
            @AuthenticationPrincipal Long userId) {
        if (spotId != null) return gatheringService.findBySpotId(spotId, userId);
        return gatheringService.findAll(userId);
    }

    // 모임 상세
    @GetMapping("/{id}")
    public GatheringResponse getGathering(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return gatheringService.findById(id, userId);
    }

    // 모임 개설 (로그인 필요)
    @PostMapping
    public ResponseEntity<GatheringResponse> createGathering(
            @Valid @RequestBody GatheringRequest request,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(gatheringService.create(request, userId));
    }

    // 모임 취소 (개설자만)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGathering(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        gatheringService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    // 참여
    @PostMapping("/{id}/join")
    public ResponseEntity<GatheringResponse> join(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(gatheringService.join(id, userId));
    }

    // 참여 취소
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        gatheringService.leave(id, userId);
        return ResponseEntity.noContent().build();
    }

    // 참여자 목록
    @GetMapping("/{id}/participants")
    public List<GatheringParticipantResponse> getParticipants(@PathVariable Long id) {
        return gatheringService.getParticipants(id);
    }

    // 댓글 목록
    @GetMapping("/{id}/comments")
    public List<GatheringComment> getComments(@PathVariable Long id) {
        return gatheringService.getComments(id);
    }

    // 댓글 작성 (로그인 필요)
    @PostMapping("/{id}/comments")
    public ResponseEntity<GatheringComment> addComment(
            @PathVariable Long id,
            @Valid @RequestBody GatheringCommentRequest request,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(gatheringService.addComment(id, request, userId));
    }

    // 댓글 삭제 (본인만)
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        gatheringService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
