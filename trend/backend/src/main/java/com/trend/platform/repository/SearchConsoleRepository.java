package com.trend.platform.repository;

import com.trend.platform.entity.SearchConsoleData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface SearchConsoleRepository extends JpaRepository<SearchConsoleData, Long> {
    List<SearchConsoleData> findByCollectedAtAfterOrderByClicksDesc(LocalDateTime after);
}