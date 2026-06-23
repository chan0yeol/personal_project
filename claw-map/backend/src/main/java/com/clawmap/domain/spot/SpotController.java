package com.clawmap.domain.spot;

import com.clawmap.domain.video.VideoResponse;
import com.clawmap.domain.video.VideoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spots")
@RequiredArgsConstructor
public class SpotController {

    private final SpotService spotService;
    private final VideoService videoService;
    private final GalleryService galleryService;

    // 지도 범위 내 스팟 목록 (핀 표시용)
    @GetMapping
    public List<Spot> getSpots(
            @RequestParam Double swLat, @RequestParam Double neLat,
            @RequestParam Double swLng, @RequestParam Double neLng) {
        return spotService.findByBounds(swLat, neLat, swLng, neLng);
    }

    // 스팟 상세 (이미지 + 좋아요 포함)
    @GetMapping("/{id}")
    public SpotDetailResponse getSpot(
            @PathVariable Long id,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @AuthenticationPrincipal Long userId) {
        return spotService.findById(id, deviceId, userId);
    }

    // 스팟 등록 - 로그인 시 userId 저장
    @PostMapping
    public ResponseEntity<SpotDetailResponse> createSpot(
            @Valid @RequestBody SpotRequest request,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(spotService.save(request, userId));
    }

    // 스팟 수정 (본인만)
    @PatchMapping("/{id}")
    public ResponseEntity<SpotDetailResponse> updateSpot(
            @PathVariable Long id,
            @Valid @RequestBody SpotRequest request,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(spotService.update(id, request, userId));
    }

    // 현위치 기준 근처 스팟 (거리순)
    @GetMapping("/nearby")
    public List<NearbySpotResponse> getNearby(
            @RequestParam Double lat, @RequestParam Double lng,
            @RequestParam(defaultValue = "2000") int radius) {
        return spotService.findNearby(lat, lng, Math.min(radius, 5000));
    }

    // 스팟 사진 갤러리 (스팟 이미지 + 리뷰 이미지 통합)
    @GetMapping("/{id}/gallery")
    public List<GalleryImageResponse> getGallery(@PathVariable Long id) {
        return galleryService.findBySpotId(id);
    }

    // 지역별 랭킹
    @GetMapping("/ranking")
    public List<SpotDetailResponse> getRanking(
            @RequestParam Double swLat, @RequestParam Double neLat,
            @RequestParam Double swLng, @RequestParam Double neLng,
            @RequestParam(defaultValue = "10") int limit) {
        return spotService.findRanking(swLat, neLat, swLng, neLng, limit);
    }

    // 스팟에 연결된 유튜브 영상 목록
    @GetMapping("/{id}/videos")
    public List<VideoResponse> getSpotVideos(@PathVariable Long id) {
        return videoService.findBySpotId(id);
    }

    // 수정 제안 등록 (로그인 필요)
    @PostMapping("/{id}/suggestions")
    public ResponseEntity<Void> suggest(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        spotService.suggest(id, body.get("content"), userId);
        return ResponseEntity.ok().build();
    }
}
