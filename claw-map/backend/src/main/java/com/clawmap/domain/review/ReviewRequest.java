package com.clawmap.domain.review;

import com.clawmap.domain.spot.Spot;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

// Jackson 역직렬화를 위해 @Setter 필수
@Getter
@Setter
public class ReviewRequest {

    @NotBlank
    private String content;

    @NotBlank
    private String nickname;

    // 업로드 완료된 이미지 URL 목록 (최대 3장)
    private List<String> imageUrls = new ArrayList<>();

    // 선택 입력 항목
    private Integer rating;
    private Integer playCount;
    private Integer spendAmount;
    private Review.CatchResult catchResult;
    private Review.MachineCondition machineCondition;
    private Boolean revisit;

    public Review toEntity(Spot spot) {
        return Review.builder()
                .spot(spot)
                .content(content)
                .nickname(nickname)
                .rating(rating)
                .playCount(playCount)
                .spendAmount(spendAmount)
                .catchResult(catchResult)
                .machineCondition(machineCondition)
                .revisit(revisit)
                .build();
    }
}
