package com.clawmap.domain.gathering;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class GatheringResponse {

    private final Long id;
    private final Long spotId;
    private final Long hostUserId;
    private final String hostNickname;
    private final String title;
    private final String description;
    private final LocalDateTime meetAt;
    private final Integer maxParticipants;
    private final Boolean isRecurring;
    private final Gathering.RecurrenceType recurrenceType;
    private final Integer recurrenceDay;
    private final Gathering.Status status;
    private final LocalDateTime createdAt;
    private final String spotName;
    private final long participantCount;
    private final boolean isJoined;
    private final boolean isHost;

    public GatheringResponse(Gathering g, String hostNickname, String spotName, long participantCount, boolean isJoined, boolean isHost) {
        this.id = g.getId();
        this.spotId = g.getSpotId();
        this.hostUserId = g.getHostUserId();
        this.hostNickname = hostNickname;
        this.title = g.getTitle();
        this.description = g.getDescription();
        this.meetAt = g.getMeetAt();
        this.maxParticipants = g.getMaxParticipants();
        this.isRecurring = g.getIsRecurring();
        this.recurrenceType = g.getRecurrenceType();
        this.recurrenceDay = g.getRecurrenceDay();
        this.status = g.getStatus();
        this.createdAt = g.getCreatedAt();
        this.spotName = spotName;
        this.participantCount = participantCount;
        this.isJoined = isJoined;
        this.isHost = isHost;
    }
}
