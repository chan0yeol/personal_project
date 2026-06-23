package com.trend.platform.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 플랫폼별 트렌드 점수 표준화 서비스.
 *
 * <h3>문제 정의</h3>
 * Google과 Naver의 0~100 수치는 기준이 다름:
 * <ul>
 *   <li>Google: 조회 기간 내 최대 관심도를 100으로 설정한 상대적 지수</li>
 *   <li>Naver DataLab: 조회 기간 내 최대 검색량을 100으로 설정한 상대적 지수</li>
 * </ul>
 * 두 수치를 직접 비교하면 의미가 없으므로, Z-score 정규화 후 0~100 스케일로 재조정.
 *
 * <h3>알고리즘</h3>
 * 1. 각 플랫폼 내에서 해당 키워드의 시계열 점수로 Z-score 계산
 * 2. Z-score를 Min-Max 스케일링으로 0~100 범위로 변환
 * 3. 변환된 점수를 DB에 normalized_score로 저장
 */
@Service
public class TrendNormalizationService {

    private static final BigDecimal SCALE_MAX = BigDecimal.valueOf(100);
    private static final int SCALE = 2;

    /**
     * 점수 목록을 받아 Min-Max 정규화된 0~100 값 목록을 반환.
     *
     * @param rawScores 원본 점수 목록 (플랫폼 원본값, 0~100)
     * @return 정규화된 점수 목록
     */
    public List<BigDecimal> normalizeMinMax(List<Integer> rawScores) {
        if (rawScores == null || rawScores.isEmpty()) return List.of();

        int max = rawScores.stream().mapToInt(Integer::intValue).max().orElse(100);
        int min = rawScores.stream().mapToInt(Integer::intValue).min().orElse(0);

        if (max == min) {
            // 모든 값이 동일하면 50으로 고정
            return rawScores.stream()
                    .map(s -> BigDecimal.valueOf(50))
                    .collect(Collectors.toList());
        }

        return rawScores.stream()
                .map(score -> {
                    double normalized = ((double) (score - min) / (max - min)) * 100.0;
                    return BigDecimal.valueOf(normalized).setScale(SCALE, RoundingMode.HALF_UP);
                })
                .collect(Collectors.toList());
    }

    /**
     * Z-score 정규화 후 0~100 스케일 변환.
     * 여러 플랫폼 데이터를 비교할 때 사용.
     *
     * @param rawScores 원본 점수 목록
     * @return 정규화된 점수 목록
     */
    public List<BigDecimal> normalizeZScore(List<Integer> rawScores) {
        if (rawScores == null || rawScores.isEmpty()) return List.of();

        double mean = rawScores.stream().mapToInt(Integer::intValue).average().orElse(0);
        double variance = rawScores.stream()
                .mapToDouble(s -> Math.pow(s - mean, 2))
                .average()
                .orElse(1);
        double stdDev = Math.sqrt(variance);

        if (stdDev == 0) {
            return rawScores.stream()
                    .map(s -> BigDecimal.valueOf(50))
                    .collect(Collectors.toList());
        }

        List<Double> zScores = rawScores.stream()
                .map(s -> (s - mean) / stdDev)
                .collect(Collectors.toList());

        // Z-score를 0~100으로 Min-Max 변환
        double zMin = zScores.stream().mapToDouble(Double::doubleValue).min().orElse(-3);
        double zMax = zScores.stream().mapToDouble(Double::doubleValue).max().orElse(3);

        return zScores.stream()
                .map(z -> {
                    double scaled = zMax == zMin ? 50.0 : ((z - zMin) / (zMax - zMin)) * 100.0;
                    return BigDecimal.valueOf(scaled).setScale(SCALE, RoundingMode.HALF_UP);
                })
                .collect(Collectors.toList());
    }

    /**
     * 단일 점수를 플랫폼별 기준으로 정규화.
     * 플랫폼의 특성에 따라 보정 계수를 다르게 적용.
     *
     * @param rawScore  원본 점수 (0~100)
     * @param platform  플랫폼 구분
     * @return 정규화된 점수
     */
    public BigDecimal normalizeSingle(int rawScore, String platform) {
        // 플랫폼별 가중치 보정 (추후 실증 데이터 기반으로 조정)
        double factor = switch (platform.toUpperCase()) {
            case "GOOGLE" -> 1.0;    // 기준점
            case "NAVER"  -> 0.95;   // 네이버는 검색 기반으로 소폭 보정
            case "YOUTUBE"-> 0.85;   // 유튜브는 조회수 기반으로 다른 스케일
            default -> 1.0;
        };
        double adjusted = Math.min(100.0, rawScore * factor);
        return BigDecimal.valueOf(adjusted).setScale(SCALE, RoundingMode.HALF_UP);
    }
}
