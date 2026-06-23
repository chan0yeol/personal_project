package com.chanyeols.dashboard.container.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ContainerSummaryDto {
    private String id;
    private String shortId;
    private List<String> names;
    private String image;
    private String status;
    private String state;
    private Long created;
}
