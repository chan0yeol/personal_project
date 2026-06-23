package com.clawmap.domain.report;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReportRequest {

    @NotNull
    private Report.TargetType targetType;

    @NotNull
    private Long targetId;

    private String reason;

    public Report toEntity() {
        return Report.builder()
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .build();
    }
}
