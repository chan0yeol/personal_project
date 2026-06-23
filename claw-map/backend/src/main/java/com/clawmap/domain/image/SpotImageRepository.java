package com.clawmap.domain.image;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpotImageRepository extends JpaRepository<SpotImage, Long> {

    // 스팟 ID로 이미지 목록 순서대로 조회
    List<SpotImage> findBySpotIdOrderByDisplayOrderAsc(Long spotId);
}
