package com.clawmap.domain.report;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class ReportResponse {

    private final Long id;
    private final Report.TargetType targetType;
    private final Long targetId;
    private final String reason;
    private final LocalDateTime createdAt;
    private final String targetSummary; // 신고 대상 요약 (스팟명 or 리뷰 내용 앞 50자)

    public ReportResponse(Report report, String targetSummary) {
        this.id = report.getId();
        this.targetType = report.getTargetType();
        this.targetId = report.getTargetId();
        this.reason = report.getReason();
        this.createdAt = report.getCreatedAt();
        this.targetSummary = targetSummary;
    }
}
