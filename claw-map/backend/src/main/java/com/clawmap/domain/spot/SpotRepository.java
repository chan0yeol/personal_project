package com.clawmap.domain.spot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SpotRepository extends JpaRepository<Spot, Long> {

    @Query("""
        SELECT s FROM Spot s
        WHERE s.lat BETWEEN :swLat AND :neLat
        AND s.lng BETWEEN :swLng AND :neLng
    """)
    List<Spot> findByBounds(
        @Param("swLat") Double swLat, @Param("neLat") Double neLat,
        @Param("swLng") Double swLng, @Param("neLng") Double neLng
    );

    // 마이페이지: 유저가 등록한 스팟
    List<Spot> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);
}
