package com.clawmap.auth;

import com.clawmap.domain.like.LikeService;
import com.clawmap.domain.user.UserRepository;
import com.clawmap.domain.user.UserResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final LikeService likeService;

    // 현재 로그인된 유저 정보 반환 (비로그인 시 401)
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ResponseEntity.status(401).build();
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.status(401).build());
    }

    // 로그아웃 - JWT 쿠키 삭제
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearCookie(response, "access_token");
        clearCookie(response, "refresh_token");
        return ResponseEntity.ok().build();
    }

    // 비로그인 찜/공감을 로그인 userId로 마이그레이션
    @PostMapping("/migrate-likes")
    public ResponseEntity<Void> migrateLikes(
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @AuthenticationPrincipal Long userId) {
        if (userId != null && deviceId != null) {
            likeService.migrateLikes(deviceId, userId);
        }
        return ResponseEntity.ok().build();
    }

    // Refresh Token으로 Access Token 재발급
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || !jwtTokenProvider.validate(refreshToken)) {
            return ResponseEntity.status(401).build();
        }
        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String newAccessToken = jwtTokenProvider.generateAccessToken(userId);
        addCookie(response, "access_token", newAccessToken, (int) (jwtTokenProvider.getAccessExpiry() / 1000));
        return ResponseEntity.ok().build();
    }

    private void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }
}
