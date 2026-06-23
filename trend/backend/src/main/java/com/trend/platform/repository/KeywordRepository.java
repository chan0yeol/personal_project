package com.trend.platform.repository;

import com.trend.platform.entity.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {

    Optional<Keyword> findByName(String name);

    List<Keyword> findAllByIsActiveTrue();

    @Query("SELECT k FROM Keyword k WHERE k.isActive = true ORDER BY k.name")
    List<Keyword> findActiveKeywords();
}
