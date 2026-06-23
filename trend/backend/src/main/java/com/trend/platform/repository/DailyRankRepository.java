package com.trend.platform.repository;

import com.trend.platform.entity.DailyRank;
import com.trend.platform.entity.TrendData.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyRankRepository extends JpaRepository<DailyRank, Long> {
    List<DailyRank> findByPlatformAndRankDateOrderByRankPositionAsc(Platform platform, LocalDate rankDate);
    
    Optional<DailyRank> findByKeywordIdAndPlatformAndRankDate(Long keywordId, Platform platform, LocalDate rankDate);
    
    long countByPlatformAndRankDate(Platform platform, LocalDate rankDate);
    
    void deleteByPlatformAndRankDate(Platform platform, LocalDate rankDate);

    default List<DailyRank> findLatestRankingByPlatform(Platform platform) {
        return findByPlatformAndRankDateOrderByRankPositionAsc(platform, LocalDate.now());
    }
}