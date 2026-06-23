package com.clawmap.config;

import com.clawmap.auth.CustomOAuth2UserService;
import com.clawmap.auth.JwtAuthFilter;
import com.clawmap.auth.JwtTokenProvider;
import com.clawmap.auth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // REST API이므로 CSRF 비활성화
            .csrf(AbstractHttpConfigurer::disable)

            // 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 로그인 필요 엔드포인트
                .requestMatchers(
                    "/api/auth/me", "/api/auth/logout", "/api/auth/refresh",
                    "/api/users/me/**", "/api/users/nickname-check",
                    "/api/events/*/comments", "/api/events/comments/*"
                ).authenticated()
                // 나머지 모두 허용 (스팟 조회/등록, 리뷰 등 비로그인 허용)
                .anyRequest().permitAll()
            )

            // Google OAuth2 로그인 설정
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(info -> info.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
            )

            // 매 요청마다 JWT 검증 필터 실행
            .addFilterBefore(new JwtAuthFilter(jwtTokenProvider),
                    UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
