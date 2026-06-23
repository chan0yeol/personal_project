package com.clawmap.seeder;

import com.clawmap.domain.spot.Spot;
import com.clawmap.domain.spot.SpotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@Profile("seeder")
@Order(1)
@RequiredArgsConstructor
public class KakaoLocalSeeder implements CommandLineRunner {

    private final SpotRepository spotRepository;

    @Value("${kakao.local.api-key}")
    private String kakaoApiKey;

    private static final List<String> KEYWORDS = List.of("인형뽑기", "인형뽑기방");

    @Override
    public void run(String... args) throws Exception {
        WebClient client = WebClient.builder()
                .baseUrl("https://dapi.kakao.com")
                .defaultHeader("Authorization", "KakaoAK " + kakaoApiKey)
                .build();

        Set<String> existingAddresses = spotRepository.findAll().stream()
                .map(Spot::getAddress)
                .collect(Collectors.toSet());

        List<String> dongList = loadDongList();
        log.info("카카오 동 단위 Seeding 시작. 총 {}개 동 × {}개 키워드", dongList.size(), KEYWORDS.size());

        int total = 0;
//        for (String dong : dongList) {
//            for (String keyword : KEYWORDS) {
//                total += fetchAndSave(client, dong + " " + keyword, 1, existingAddresses);
//                try { Thread.sleep(100); } catch (InterruptedException ignored) {}
//            }
//        }

        log.info("카카오 Seeding 완료. 신규 {}개 스팟 저장됨. 누적 총 {}개.", total, spotRepository.count());
    }

    private List<String> loadDongList() throws Exception {
        List<String> result = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource("dong_list.txt");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("#")) {
                    result.add(line);
                }
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private int fetchAndSave(WebClient client, String query, int page, Set<String> existingAddresses) {
        Map<String, Object> response = client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", query)
                        .queryParam("size", 15)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorResume(e -> {
                    log.error("카카오 API 호출 실패 [{}]: {}", query, e.getMessage());
                    return Mono.empty();
                })
                .block();

        if (response == null) return 0;

        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.get("documents");
        if (documents == null || documents.isEmpty()) return 0;

        int saved = 0;
        for (Map<String, Object> doc : documents) {
            try {
                String address = (String) doc.get("road_address_name");
                if (address == null || address.isBlank()) continue;
                if (existingAddresses.contains(address)) continue;
                Spot spot = Spot.builder()
                        .name((String) doc.get("place_name"))
                        .address(address)
                        .lat(Double.parseDouble((String) doc.get("y")))
                        .lng(Double.parseDouble((String) doc.get("x")))
                        .build();
                spotRepository.save(spot);
                existingAddresses.add(address);
                saved++;
            } catch (Exception e) {
                log.warn("스팟 저장 실패: {}", e.getMessage());
            }
        }

        Map<String, Object> meta = (Map<String, Object>) response.get("meta");
        Boolean isEnd = (Boolean) meta.get("is_end");
        if (!isEnd && page < 45) {
            saved += fetchAndSave(client, query, page + 1, existingAddresses);
        }

        return saved;
    }
}
