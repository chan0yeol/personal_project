package com.clawmap.domain.tag;

import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spots/{spotId}/tags")
@RequiredArgsConstructor
public class SpotTagController {

    private final SpotTagRepository tagRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<SpotTag> getTags(@PathVariable Long spotId) {
        return tagRepository.findBySpotIdOrderByCreatedAtAsc(spotId);
    }

    @PostMapping
    public ResponseEntity<SpotTag> addTag(
            @PathVariable Long spotId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        String tag = body.getOrDefault("tag", "").trim();
        if (tag.isEmpty() || tag.length() > 20) return ResponseEntity.badRequest().build();
        if (tagRepository.existsBySpotIdAndTag(spotId, tag)) return ResponseEntity.status(409).build();
        SpotTag saved = tagRepository.save(SpotTag.builder()
                .spotId(spotId).tag(tag).userId(userId).build());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable Long spotId,
            @PathVariable Long tagId,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        SpotTag tag = tagRepository.findById(tagId).orElse(null);
        if (tag == null || !tag.getSpotId().equals(spotId)) return ResponseEntity.notFound().build();
        boolean isAdmin = userRepository.findById(userId).map(u -> u.isAdmin()).orElse(false);
        if (!isAdmin && !userId.equals(tag.getUserId())) return ResponseEntity.status(403).build();
        tagRepository.delete(tag);
        return ResponseEntity.ok().build();
    }
}
