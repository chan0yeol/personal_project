package com.clawmap.domain.user;

// 로그인된 유저 정보 응답 DTO
public record UserResponse(
        Long id,
        String nickname,
        String email,
        String profileImageUrl,
        boolean admin
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getProfileImageUrl(),
                user.isAdmin()
        );
    }
}
