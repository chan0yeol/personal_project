package com.clawmap.domain.like;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpotLikeRepository extends JpaRepository<SpotLike, Long> {

    // deviceId 기반 (비로그인)
    boolean existsBySpotIdAndDeviceId(Long spotId, String deviceId);
    void deleteBySpotIdAndDeviceId(Long spotId, String deviceId);

    // userId 기반 (로그인)
    boolean existsBySpotIdAndUserId(Long spotId, Long userId);
    void deleteBySpotIdAndUserId(Long spotId, Long userId);

    // 찜 수 집계
    long countBySpotId(Long spotId);

    // 마이페이지: 유저가 찜한 스팟 ID 목록
    List<SpotLike> findByUserId(Long userId);

    // 비로그인 찜 마이그레이션: deviceId 기반 찜 목록
    List<SpotLike> findByDeviceIdAndUserIdIsNull(String deviceId);
}
