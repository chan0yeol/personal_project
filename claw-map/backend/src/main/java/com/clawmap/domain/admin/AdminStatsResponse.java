package com.clawmap.domain.admin;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStatsResponse {

    private final long totalSpots;
    private final long totalReviews;
    private final double avgRating;      // 전체 리뷰 평균 별점 (null 제외)
    private final long totalUsers;
    private final long newSpotsThisMonth;
    private final long newReviewsThisMonth;
    private final long pendingReports;
    private final long activeGatherings;  // OPEN & meetAt > now
}
