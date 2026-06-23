package com.clawmap.seeder;

import com.clawmap.domain.spot.Spot;
import com.clawmap.domain.spot.SpotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@Profile("seeder")
@Order(2)
@RequiredArgsConstructor
public class NaverLocalSeeder implements CommandLineRunner {

    private final SpotRepository spotRepository;

    @Value("${naver.search.client-id}")
    private String clientId;

    @Value("${naver.search.client-secret}")
    private String clientSecret;

    private static final List<String> REGIONS = List.of(
        // 서울특별시 (25구)
        "서울 종로구", "서울 중구", "서울 용산구", "서울 성동구", "서울 광진구",
        "서울 동대문구", "서울 중랑구", "서울 성북구", "서울 강북구", "서울 도봉구",
        "서울 노원구", "서울 은평구", "서울 서대문구", "서울 마포구", "서울 양천구",
        "서울 강서구", "서울 구로구", "서울 금천구", "서울 영등포구", "서울 동작구",
        "서울 관악구", "서울 서초구", "서울 강남구", "서울 송파구", "서울 강동구",
        // 부산광역시 (15구 1군)
        "부산 중구", "부산 서구", "부산 동구", "부산 영도구", "부산 부산진구",
        "부산 동래구", "부산 남구", "부산 북구", "부산 해운대구", "부산 사하구",
        "부산 금정구", "부산 강서구", "부산 연제구", "부산 수영구", "부산 사상구",
        "부산 기장군",
        // 대구광역시 (7구 1군)
        "대구 중구", "대구 동구", "대구 서구", "대구 남구", "대구 북구",
        "대구 수성구", "대구 달서구", "대구 달성군",
        // 인천광역시 (8구 2군)
        "인천 중구", "인천 동구", "인천 미추홀구", "인천 연수구", "인천 남동구",
        "인천 부평구", "인천 계양구", "인천 서구",
        // 광주광역시 (5구)
        "광주 동구", "광주 서구", "광주 남구", "광주 북구", "광주 광산구",
        // 대전광역시 (5구)
        "대전 동구", "대전 중구", "대전 서구", "대전 유성구", "대전 대덕구",
        // 울산광역시 (4구 1군)
        "울산 중구", "울산 남구", "울산 동구", "울산 북구", "울산 울주군",
        // 세종특별자치시
        "세종시",
        // 경기도
        "수원 장안구", "수원 권선구", "수원 팔달구", "수원 영통구",
        "성남 수정구", "성남 중원구", "성남 분당구",
        "고양 덕양구", "고양 일산동구", "고양 일산서구",
        "용인 처인구", "용인 기흥구", "용인 수지구",
        "부천시",
        "안산 단원구", "안산 상록구",
        "안양 만안구", "안양 동안구",
        "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시",
        "김포시", "광명시", "하남시", "오산시", "이천시", "양주시",
        "군포시", "구리시", "안성시", "포천시", "의왕시", "여주시",
        "동두천시", "과천시", "경기 광주시",
        // 강원도
        "춘천시", "원주시", "강릉시", "동해시", "속초시", "삼척시",
        // 충청북도
        "청주 상당구", "청주 서원구", "청주 흥덕구", "청주 청원구",
        "충주시", "제천시",
        // 충청남도
        "천안 동남구", "천안 서북구", "공주시", "보령시", "아산시",
        "서산시", "논산시", "당진시",
        // 전라북도
        "전주 완산구", "전주 덕진구", "군산시", "익산시", "정읍시", "남원시", "김제시",
        // 전라남도
        "목포시", "여수시", "순천시", "나주시", "광양시",
        // 경상북도
        "포항 남구", "포항 북구", "경주시", "김천시", "안동시", "구미시",
        "영주시", "영천시", "상주시", "문경시", "경산시",
        // 경상남도
        "창원 의창구", "창원 성산구", "창원 마산합포구", "창원 마산회원구", "창원 진해구",
        "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시",
        // 제주특별자치도
        "제주시", "서귀포시"
    );

    private static final List<String> BASE_KEYWORDS = List.of("인형뽑기", "뽑기방");

    @Override
    public void run(String... args) {
        WebClient client = WebClient.builder()
                .baseUrl("https://openapi.naver.com")
                .defaultHeader("X-Naver-Client-Id", clientId)
                .defaultHeader("X-Naver-Client-Secret", clientSecret)
                .build();

        Set<String> existingAddresses = spotRepository.findAll().stream()
                .map(Spot::getAddress)
                .collect(Collectors.toSet());

        log.info("네이버 시/군/구 단위 Seeding 시작. 총 {}개 지역 × {}개 키워드", REGIONS.size(), BASE_KEYWORDS.size());

        int saved = 0;
//        for (String region : REGIONS) {
//            for (String base : BASE_KEYWORDS) {
//                log.info("region : {} base : {}", region, base);
//                saved += fetchAndSave(client, region + " " + base, existingAddresses);
//                try { Thread.sleep(400); } catch (InterruptedException ignored) {}
//            }
//        }

        log.info("네이버 Seeding 완료. {}개 스팟 추가됨.", saved);
    }

    @SuppressWarnings("unchecked")
    private int fetchAndSave(WebClient client, String keyword, Set<String> existingAddresses) {
        int saved = 0;

        for (int start = 1; start <= 21; start += 5) {
            final int page = start;
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}

            Map<String, Object> response = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/search/local.json")
                            .queryParam("query", keyword)
                            .queryParam("display", 5)
                            .queryParam("start", page)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .onErrorResume(e -> {
                        log.error("네이버 API 호출 실패 [{}]: {}", keyword, e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            if (response == null) break;

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            if (items == null || items.isEmpty()) break;

            for (Map<String, Object> item : items) {
                try {
                    String address = (String) item.get("roadAddress");
                    if (address == null || address.isBlank()) address = (String) item.get("address");
                    if (existingAddresses.contains(address)) continue;

                    double lat = Long.parseLong((String) item.get("mapy")) / 1e7;
                    double lng = Long.parseLong((String) item.get("mapx")) / 1e7;
                    String name = ((String) item.get("title")).replaceAll("<[^>]*>", "");

                    Spot spot = Spot.builder()
                            .name(name)
                            .address(address)
                            .lat(lat)
                            .lng(lng)
                            .build();
                    spotRepository.save(spot);
                    existingAddresses.add(address);
                    saved++;
                } catch (Exception e) {
                    log.warn("네이버 스팟 저장 실패: {}", e.getMessage());
                }
            }
        }
        return saved;
    }
}
