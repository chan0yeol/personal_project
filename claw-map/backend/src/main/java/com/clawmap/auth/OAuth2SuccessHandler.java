package com.clawmap.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // OAuth2 로그인 성공 후 JWT 쿠키 발급 → 프론트로 리다이렉트
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        UserPrincipal principal = (UserPrincipal) token.getPrincipal();
        Long userId = principal.getUserId();

        String accessToken  = jwtTokenProvider.generateAccessToken(userId);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        addCookie(response, "access_token",  accessToken,  (int) (jwtTokenProvider.getAccessExpiry()  / 1000));
        addCookie(response, "refresh_token", refreshToken, (int) (jwtTokenProvider.getRefreshExpiry() / 1000));

        log.info("로그인 성공: userId={}", userId);
        response.sendRedirect(frontendUrl);
    }

    // httpOnly 쿠키 생성 (JS에서 접근 불가 → XSS 방지)
    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }
}
