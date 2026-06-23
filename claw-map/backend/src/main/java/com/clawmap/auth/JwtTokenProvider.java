package com.clawmap.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessExpiry;
    private final long refreshExpiry;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiry}") long accessExpiry,
            @Value("${jwt.refresh-expiry}") long refreshExpiry) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessExpiry = accessExpiry;
        this.refreshExpiry = refreshExpiry;
    }

    // Access Token 생성 (15분)
    public String generateAccessToken(Long userId) {
        return buildToken(userId, accessExpiry);
    }

    // Refresh Token 생성 (7일)
    public String generateRefreshToken(Long userId) {
        return buildToken(userId, refreshExpiry);
    }

    private String buildToken(Long userId, long expiry) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiry))
                .signWith(key)
                .compact();
    }

    // 토큰에서 유저 ID 추출
    public Long getUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.parseLong(claims.getSubject());
    }

    // 토큰 유효성 검증
    public boolean validate(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("유효하지 않은 JWT 토큰: {}", e.getMessage());
            return false;
        }
    }

    public long getAccessExpiry() { return accessExpiry; }
    public long getRefreshExpiry() { return refreshExpiry; }
}
