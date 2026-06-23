package com.clawmap.domain.video;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    // 전체 영상 목록
    @GetMapping
    public List<VideoResponse> getVideos() {
        return videoService.findAll();
    }

    // 영상 상세
    @GetMapping("/{id}")
    public VideoResponse getVideo(@PathVariable Long id) {
        return videoService.findById(id);
    }

    // 유튜브 URL 미리보기 (oEmbed)
    @GetMapping("/preview")
    public ResponseEntity<Map<String, String>> preview(@RequestParam String url) {
        return ResponseEntity.ok(videoService.preview(url));
    }

    // 영상 등록 (admin only)
    @PostMapping
    public ResponseEntity<VideoResponse> createVideo(
            @Valid @RequestBody VideoRequest request,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(videoService.create(request, userId));
    }

    // 영상 삭제 (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        videoService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
