package com.clawmap.auth;

import com.clawmap.domain.user.User;
import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    // Google 로그인 성공 후 호출 - 유저 저장 또는 업데이트
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String googleId = (String) attributes.get("sub");
        String email    = (String) attributes.get("email");
        String nickname = (String) attributes.get("name");
        String picture  = (String) attributes.get("picture");

        User user = userRepository.findByGoogleId(googleId)
                .map(existing -> {
                    // 재로그인 시 프로필 이미지만 갱신 (사용자가 변경한 닉네임은 유지)
                    existing.updateProfileImage(picture);
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("신규 유저 가입: {}", email);
                    return userRepository.save(User.builder()
                            .googleId(googleId)
                            .email(email)
                            .nickname(nickname)
                            .profileImageUrl(picture)
                            .build());
                });

        return new UserPrincipal(user, attributes);
    }
}
