package com.clawmap.domain.gathering;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class GatheringParticipantResponse {

    private final Long userId;
    private final String nickname;
    private final String profileImageUrl;
    private final LocalDateTime joinedAt;

    public GatheringParticipantResponse(GatheringParticipant p, String nickname, String profileImageUrl) {
        this.userId = p.getUserId();
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.joinedAt = p.getJoinedAt();
    }
}
