package com.clawmap.domain.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findBySpotIdOrderByCreatedAtDesc(Long spotId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);
    long countBySpotId(Long spotId);

    // ── 내 뽑기 기록 통계 쿼리 ────────────────────────────
    long countByUserId(Long userId);

    @Query("SELECT COUNT(DISTINCT r.spot.id) FROM Review r WHERE r.userId = :userId")
    long countDistinctSpotsByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(r.playCount), 0) FROM Review r WHERE r.userId = :userId AND r.playCount IS NOT NULL")
    long sumPlayCountByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(r.spendAmount), 0) FROM Review r WHERE r.userId = :userId AND r.spendAmount IS NOT NULL")
    long sumSpendAmountByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId AND r.catchResult = com.clawmap.domain.review.Review$CatchResult.SUCCESS")
    long countSuccessByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId AND r.catchResult IS NOT NULL")
    long countWithCatchResultByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId AND r.revisit = true")
    long countRevisitTrueByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId AND r.revisit IS NOT NULL")
    long countWithRevisitByUserId(@Param("userId") Long userId);
}
