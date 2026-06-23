package com.clawmap.domain.gathering;

import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.user.User;
import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GatheringService {

    private final GatheringRepository gatheringRepository;
    private final GatheringParticipantRepository participantRepository;
    private final GatheringCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final SpotRepository spotRepository;

    public List<GatheringResponse> findBySpotId(Long spotId, Long userId) {
        return gatheringRepository
                .findBySpotIdAndStatusNotOrderByMeetAtAsc(spotId, Gathering.Status.CANCELLED)
                .stream()
                .map(g -> toResponse(g, userId))
                .toList();
    }

    // spotId 없이 전체 모임 조회 (취소 제외, meetAt 오름차순)
    public List<GatheringResponse> findAll(Long userId) {
        return gatheringRepository.findByStatusNotOrderByMeetAtAsc(Gathering.Status.CANCELLED)
                .stream()
                .map(g -> toResponse(g, userId))
                .toList();
    }

    public GatheringResponse findById(Long id, Long userId) {
        Gathering g = getOrThrow(id);
        return toResponse(g, userId);
    }

    @Transactional
    public GatheringResponse create(GatheringRequest request, Long userId) {
        Gathering g = gatheringRepository.save(Gathering.builder()
                .spotId(request.getSpotId())
                .hostUserId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .meetAt(request.getMeetAt())
                .maxParticipants(request.getMaxParticipants())
                .isRecurring(request.getIsRecurring())
                .recurrenceType(request.getRecurrenceType())
                .recurrenceDay(request.getRecurrenceDay())
                .status(Gathering.Status.OPEN)
                .build());
        // 개설자 자동 참여
        participantRepository.save(GatheringParticipant.builder()
                .gatheringId(g.getId()).userId(userId).build());
        return toResponse(g, userId);
    }

    @Transactional
    public void delete(Long gatheringId, Long userId) {
        Gathering g = getOrThrow(gatheringId);
        if (!g.getHostUserId().equals(userId)) {
            throw new IllegalStateException("개설자만 모임을 삭제할 수 있습니다.");
        }
        g.cancel();
    }

    @Transactional
    public GatheringResponse join(Long gatheringId, Long userId) {
        Gathering g = getOrThrow(gatheringId);
        if (g.getStatus() != Gathering.Status.OPEN) {
            throw new IllegalStateException("참여할 수 없는 모임입니다.");
        }
        if (participantRepository.existsByGatheringIdAndUserId(gatheringId, userId)) {
            throw new IllegalStateException("이미 참여한 모임입니다.");
        }
        if (g.getMaxParticipants() != null
                && participantRepository.countByGatheringId(gatheringId) >= g.getMaxParticipants()) {
            throw new IllegalStateException("정원이 꽉 찼습니다.");
        }
        participantRepository.save(GatheringParticipant.builder()
                .gatheringId(gatheringId).userId(userId).build());
        return toResponse(g, userId);
    }

    @Transactional
    public void leave(Long gatheringId, Long userId) {
        Gathering g = getOrThrow(gatheringId);
        if (g.getHostUserId().equals(userId)) {
            throw new IllegalStateException("개설자는 모임을 나갈 수 없습니다. 모임을 삭제해 주세요.");
        }
        participantRepository.deleteByGatheringIdAndUserId(gatheringId, userId);
    }

    public List<GatheringParticipantResponse> getParticipants(Long gatheringId) {
        return participantRepository.findByGatheringId(gatheringId).stream()
                .map(p -> {
                    User user = userRepository.findById(p.getUserId()).orElse(null);
                    String nickname = user != null ? (user.getNickname() != null ? user.getNickname() : user.getEmail()) : "알 수 없음";
                    String profileImageUrl = user != null ? user.getProfileImageUrl() : null;
                    return new GatheringParticipantResponse(p, nickname, profileImageUrl);
                })
                .toList();
    }

    public List<GatheringComment> getComments(Long gatheringId) {
        return commentRepository.findByGatheringIdOrderByCreatedAtAsc(gatheringId);
    }

    @Transactional
    public GatheringComment addComment(Long gatheringId, GatheringCommentRequest request, Long userId) {
        getOrThrow(gatheringId);
        String nickname = userRepository.findById(userId)
                .map(u -> u.getNickname() != null ? u.getNickname() : u.getEmail())
                .orElse("알 수 없음");
        return commentRepository.save(GatheringComment.builder()
                .gatheringId(gatheringId)
                .userId(userId)
                .nickname(nickname)
                .content(request.getContent())
                .build());
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        commentRepository.deleteByIdAndUserId(commentId, userId);
    }

    private Gathering getOrThrow(Long id) {
        return gatheringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 모임입니다."));
    }

    private GatheringResponse toResponse(Gathering g, Long userId) {
        String hostNickname = userRepository.findById(g.getHostUserId())
                .map(u -> u.getNickname() != null ? u.getNickname() : u.getEmail())
                .orElse("알 수 없음");
        String spotName = spotRepository.findById(g.getSpotId())
                .map(s -> s.getName()).orElse("");
        long count = participantRepository.countByGatheringId(g.getId());
        boolean isJoined = userId != null && participantRepository.existsByGatheringIdAndUserId(g.getId(), userId);
        boolean isHost = userId != null && g.getHostUserId().equals(userId);
        return new GatheringResponse(g, hostNickname, spotName, count, isJoined, isHost);
    }
}
