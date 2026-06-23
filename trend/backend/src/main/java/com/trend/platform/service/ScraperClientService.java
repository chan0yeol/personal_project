package com.trend.platform.service;

import com.trend.platform.dto.ScraperResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScraperClientService {

    @Qualifier("scraperWebClient")
    private final WebClient scraperWebClient;

    private static final Duration TIMEOUT = Duration.ofSeconds(35);

    public Mono<ScraperResponse.GoogleTrends> fetchGoogleTrends(List<String> keywords, String timeframe, String geo) {
        return scraperWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/collect/google")
                        .queryParam("keywords", keywords)
                        .queryParam("timeframe", timeframe)
                        .queryParam("geo", geo)
                        .build())
                .retrieve()
                .bodyToMono(ScraperResponse.GoogleTrends.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> Mono.just(new ScraperResponse.GoogleTrends()));
    }

    public Mono<ScraperResponse.GoogleRealtime> fetchGoogleRealtime(String geo) {
        return scraperWebClient.get()
                .uri("/collect/google/realtime?geo=" + geo)
                .retrieve()
                .bodyToMono(ScraperResponse.GoogleRealtime.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> Mono.just(new ScraperResponse.GoogleRealtime()));
    }

    public Mono<ScraperResponse.NaverNews> fetchNaverNews(String keyword) {
        return scraperWebClient.get()
                .uri("/collect/naver-news?keyword=" + keyword)
                .retrieve()
                .bodyToMono(ScraperResponse.NaverNews.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> Mono.just(new ScraperResponse.NaverNews()));
    }

    public Mono<ScraperResponse.GoogleTrends> fetchNaverDatalab(List<String> keywords, String startDate, String endDate) {
        return scraperWebClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/collect/naver-datalab")
                        .queryParam("keywords", keywords)
                        .queryParam("start_date", startDate)
                        .queryParam("end_date", endDate)
                        .build())
                .retrieve()
                .bodyToMono(ScraperResponse.GoogleTrends.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> Mono.just(new ScraperResponse.GoogleTrends()));
    }

    public Mono<ScraperResponse.NaverRealtime> fetchNaverRealtime() {
        return scraperWebClient.get()
                .uri("/collect/naver-realtime")
                .retrieve()
                .bodyToMono(ScraperResponse.NaverRealtime.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> {
                    log.warn("[NaverRealtime] Scraping failed: {}", e.getMessage());
                    return Mono.just(new ScraperResponse.NaverRealtime());
                });
    }

    public Mono<ScraperResponse.GoogleSearchConsole> fetchSearchConsole(String siteUrl, int days) {
        return scraperWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/collect/google-search-console")
                        .queryParam("site_url", siteUrl)
                        .queryParam("days", days)
                        .build())
                .retrieve()
                .bodyToMono(ScraperResponse.GoogleSearchConsole.class)
                .timeout(TIMEOUT)
                .onErrorResume(e -> {
                    ScraperResponse.GoogleSearchConsole empty = new ScraperResponse.GoogleSearchConsole();
                    empty.setStatus("error");
                    return Mono.just(empty);
                });
    }
}