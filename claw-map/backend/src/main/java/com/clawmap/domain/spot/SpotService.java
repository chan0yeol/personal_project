package com.clawmap.domain.spot;

import com.clawmap.domain.image.SpotImage;
import com.clawmap.domain.image.SpotImageRepository;
import com.clawmap.domain.like.LikeService;
import com.clawmap.domain.like.SpotLikeRepository;
import com.clawmap.domain.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpotService {

    private final SpotRepository spotRepository;
    private final SpotImageRepository spotImageRepository;
    private final LikeService likeService;
    private final SpotSuggestionRepository suggestionRepository;
    private final SpotLikeRepository spotLikeRepository;
    private final ReviewRepository reviewRepository;

    // 지도 범위 내 스팟 목록 (이미지 미포함)
    public List<Spot> findByBounds(Double swLat, Double neLat, Double swLng, Double neLng) {
        return spotRepository.findByBounds(swLat, neLat, swLng, neLng);
    }

    // 스팟 상세 - 이미지 + 좋아요 포함
    public SpotDetailResponse findById(Long id, String deviceId, Long userId) {
        Spot spot = spotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스팟입니다."));
        List<SpotImage> images = spotImageRepository.findBySpotIdOrderByDisplayOrderAsc(id);
        var like = likeService.getSpotLike(id, deviceId, userId);
        return new SpotDetailResponse(spot, images, like.likeCount(), like.liked());
    }

    // 마이페이지: 유저가 등록한 스팟 목록
    public List<Spot> findByUserId(Long userId) {
        return spotRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 스팟 수정 (본인만)
    @Transactional
    public SpotDetailResponse update(Long spotId, SpotRequest request, Long userId) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스팟입니다."));
        if (!userId.equals(spot.getUserId())) {
            throw new IllegalStateException("본인이 등록한 스팟만 수정할 수 있습니다.");
        }
        spot.update(request.getName(), request.getAddress(), request.getParking(),
                request.getCoin500(), request.getCoin1000(), request.getDifficulty(), request.getOpenTime());
        List<SpotImage> images = spotImageRepository.findBySpotIdOrderByDisplayOrderAsc(spotId);
        var like = likeService.getSpotLike(spotId, null, userId);
        return new SpotDetailResponse(spot, images, like.likeCount(), like.liked());
    }

    // 지역별 랭킹 - 범위 내 스팟을 찜+리뷰 기준으로 정렬
    public List<SpotDetailResponse> findRanking(Double swLat, Double neLat, Double swLng, Double neLng, int limit) {
        return spotRepository.findByBounds(swLat, neLat, swLng, neLng).stream()
                .map(spot -> {
                    long likeCount = spotLikeRepository.countBySpotId(spot.getId());
                    long reviewCount = reviewRepository.countBySpotId(spot.getId());
                    double avgRating = reviewRepository.findBySpotIdOrderByCreatedAtDesc(spot.getId())
                            .stream().filter(r -> r.getRating() != null)
                            .mapToInt(r -> r.getRating()).average().orElse(0.0);
                    List<SpotImage> images = spotImageRepository.findBySpotIdOrderByDisplayOrderAsc(spot.getId());
                    return new SpotDetailResponse(spot, images, likeCount, false, reviewCount, Math.round(avgRating * 10.0) / 10.0);
                })
                .sorted(Comparator.comparingDouble(r -> -(r.getLikeCount() * 0.4 + r.getReviewCount() * 0.6)))
                .limit(limit)
                .toList();
    }

    // 현위치 기준 반경 내 스팟 (거리순)
    public List<NearbySpotResponse> findNearby(Double lat, Double lng, int radiusMeters) {
        double delta = radiusMeters / 100000.0;
        List<Spot> candidates = spotRepository.findByBounds(lat - delta, lat + delta, lng - delta, lng + delta);
        return candidates.stream()
                .map(spot -> {
                    double dist = haversineMeters(lat, lng, spot.getLat(), spot.getLng());
                    long likeCount = spotLikeRepository.countBySpotId(spot.getId());
                    long reviewCount = reviewRepository.countBySpotId(spot.getId());
                    double avg = reviewRepository.findBySpotIdOrderByCreatedAtDesc(spot.getId())
                            .stream().filter(r -> r.getRating() != null)
                            .mapToInt(r -> r.getRating()).average().orElse(0.0);
                    return new NearbySpotResponse(spot.getId(), spot.getName(), spot.getAddress(),
                            spot.getLat(), spot.getLng(), dist, Math.round(avg * 10.0) / 10.0, reviewCount, likeCount);
                })
                .filter(r -> r.distanceMeters() <= radiusMeters)
                .sorted(Comparator.comparingDouble(NearbySpotResponse::distanceMeters))
                .collect(Collectors.toList());
    }

    private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 수정 제안 등록
    @Transactional
    public void suggest(Long spotId, String content, Long userId) {
        spotRepository.findById(spotId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스팟입니다."));
        suggestionRepository.save(SpotSuggestion.builder()
                .spotId(spotId).userId(userId).content(content)
                .status(SpotSuggestion.Status.PENDING).build());
    }

    // 스팟 저장 - 로그인 유저면 userId 함께 저장
    @Transactional
    public SpotDetailResponse save(SpotRequest request, Long userId) {
        Spot spot = spotRepository.save(
                Spot.builder()
                        .name(request.getName()).address(request.getAddress())
                        .lat(request.getLat()).lng(request.getLng())
                        .parking(request.getParking()).coin500(request.getCoin500())
                        .coin1000(request.getCoin1000()).difficulty(request.getDifficulty())
                        .openTime(request.getOpenTime()).userId(userId)
                        .build()
        );

        List<String> imageUrls = request.getImageUrls();
        for (int i = 0; i < imageUrls.size(); i++) {
            spotImageRepository.save(SpotImage.builder()
                    .spotId(spot.getId()).url(imageUrls.get(i))
                    .main(i == 0).displayOrder(i).build());
        }

        List<SpotImage> saved = spotImageRepository.findBySpotIdOrderByDisplayOrderAsc(spot.getId());
        return new SpotDetailResponse(spot, saved, 0, false);
    }
}
