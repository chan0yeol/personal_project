package com.clawmap.domain.spot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

// Jackson 역직렬화를 위해 @Setter 필수
@Getter
@Setter
public class SpotRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotNull
    private Double lat;

    @NotNull
    private Double lng;

    private Boolean parking;
    private Boolean coin500;
    private Boolean coin1000;
    private Spot.Difficulty difficulty;
    private String openTime;

    // 업로드 완료된 이미지 URL 목록 (최대 5장)
    private List<String> imageUrls = new ArrayList<>();

    public Spot toEntity() {
        return Spot.builder()
                .name(name)
                .address(address)
                .lat(lat)
                .lng(lng)
                .parking(parking)
                .coin500(coin500)
                .coin1000(coin1000)
                .difficulty(difficulty)
                .openTime(openTime)
                .build();
    }
}
