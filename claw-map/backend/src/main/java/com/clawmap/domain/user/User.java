package com.clawmap.domain.user;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 구글 OAuth sub (고유 식별자)
    @Column(unique = true, nullable = false)
    private String googleId;

    private String email;
    private String nickname;
    private String profileImageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean admin = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // 재로그인 시 프로필 이미지만 갱신 (닉네임은 유지)
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    // 사용자가 직접 닉네임 변경
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
}
