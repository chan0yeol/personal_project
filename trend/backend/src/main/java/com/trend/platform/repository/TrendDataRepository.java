package com.trend.platform.repository;

import com.trend.platform.entity.TrendData;
import com.trend.platform.entity.TrendData.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TrendDataRepository extends JpaRepository<TrendData, Long> {

    @Query("""
        SELECT t FROM TrendData t
        WHERE t.keyword.name = :keyword
          AND t.platform = :platform
          AND t.recordDate BETWEEN :from AND :to
        ORDER BY t.recordDate ASC
        """)
    List<TrendData> findByKeywordAndPlatformAndDateRange(
            @Param("keyword") String keyword,
            @Param("platform") Platform platform,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT t FROM TrendData t
        WHERE t.keyword.name IN :keywords
          AND t.platform = :platform
          AND t.recordDate BETWEEN :from AND :to
        ORDER BY t.keyword.name, t.recordDate ASC
        """)
    List<TrendData> findByKeywordsAndPlatformAndDateRange(
            @Param("keywords") List<String> keywords,
            @Param("platform") Platform platform,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    boolean existsByKeywordNameAndPlatformAndRecordDate(String keywordName, Platform platform, LocalDate date);
}
