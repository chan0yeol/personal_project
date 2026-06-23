package com.clawmap.domain.video;

import com.clawmap.domain.spot.Spot;
import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VideoService {

    private final YoutubeVideoRepository videoRepository;
    private final VideoSpotLinkRepository linkRepository;
    private final SpotRepository spotRepository;
    private final UserRepository userRepository;
    private final WebClient webClient;

    public List<VideoResponse> findAll() {
        return videoRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    public VideoResponse findById(Long id) {
        YoutubeVideo video = videoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 영상입니다."));
        return toResponse(video);
    }

    // 유튜브 URL → 영상 정보 미리보기 (oEmbed)
    public Map<String, String> preview(String youtubeUrl) {
        String videoId = extractVideoId(youtubeUrl);
        if (videoId == null) throw new IllegalArgumentException("유효하지 않은 유튜브 URL입니다.");

        String videoUrl = "https://www.youtube.com/watch?v=" + videoId;
        String thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg";

        try {
            // url 파라미터를 queryParam으로 전달해야 특수문자가 올바르게 인코딩됨
            String oembed = webClient.get()
                    .uri(builder -> builder
                            .scheme("https").host("www.youtube.com").path("/oembed")
                            .queryParam("url", videoUrl)
                            .queryParam("format", "json")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            String title = extractJson(oembed, "title");
            return Map.of("youtubeId", videoId, "title", title, "thumbnailUrl", thumbnailUrl);
        } catch (Exception e) {
            log.warn("oEmbed 호출 실패 (videoId={}): {}", videoId, e.getMessage());
            // oEmbed 실패해도 videoId와 빈 title 반환 (관리자가 직접 입력)
            return Map.of("youtubeId", videoId, "title", "", "thumbnailUrl", thumbnailUrl);
        }
    }

    @Transactional
    public VideoResponse create(VideoRequest request, Long userId) {
        if (videoRepository.existsByYoutubeId(request.getYoutubeId())) {
            throw new IllegalStateException("이미 등록된 영상입니다.");
        }
        YoutubeVideo video = videoRepository.save(YoutubeVideo.builder()
                .youtubeId(request.getYoutubeId())
                .title(request.getTitle())
                .description(request.getDescription())
                .userId(userId)
                .build());

        request.getSpotIds().forEach(spotId ->
            linkRepository.save(VideoSpotLink.builder()
                    .videoId(video.getId()).spotId(spotId).build()));

        return toResponse(video);
    }

    @Transactional
    public void delete(Long videoId, Long userId) {
        YoutubeVideo video = videoRepository.findById(videoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 영상입니다."));
        boolean isAdmin = userRepository.findById(userId).map(u -> u.isAdmin()).orElse(false);
        if (!isAdmin) throw new IllegalStateException("관리자만 삭제할 수 있습니다.");

        linkRepository.deleteByVideoId(videoId);
        videoRepository.delete(video);
    }

    public List<VideoResponse> findBySpotId(Long spotId) {
        return linkRepository.findBySpotId(spotId).stream()
                .map(link -> videoRepository.findById(link.getVideoId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> toResponse(opt.get()))
                .toList();
    }

    private VideoResponse toResponse(YoutubeVideo video) {
        List<Spot> spots = linkRepository.findByVideoId(video.getId()).stream()
                .map(link -> spotRepository.findById(link.getSpotId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .toList();
        return new VideoResponse(video, spots);
    }

    // 유튜브 URL에서 video ID 추출
    public static String extractVideoId(String url) {
        if (url == null) return null;
        String[] patterns = {
            "youtu\\.be/([a-zA-Z0-9_-]{11})",
            "youtube\\.com/watch\\?v=([a-zA-Z0-9_-]{11})",
            "youtube\\.com/shorts/([a-zA-Z0-9_-]{11})",
            "youtube\\.com/embed/([a-zA-Z0-9_-]{11})"
        };
        for (String pattern : patterns) {
            Matcher m = Pattern.compile(pattern).matcher(url);
            if (m.find()) return m.group(1);
        }
        // 이미 순수 ID인 경우
        if (url.matches("[a-zA-Z0-9_-]{11}")) return url;
        return null;
    }

    private String extractJson(String json, String key) {
        if (json == null) return "";
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"(.*?)\"");
        Matcher m = p.matcher(json);
        return m.find() ? m.group(1).replace("\\u0026", "&").replace("\\/", "/") : "";
    }
}
