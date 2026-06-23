package com.clawmap.auth;

import com.clawmap.domain.user.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

// OAuth2 인증 과정에서 사용되는 커스텀 Principal
@Getter
public class UserPrincipal implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public UserPrincipal(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    public Long getUserId() {
        return user.getId();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    // Spring Security 내부에서 사용하는 이름 (구글 sub)
    @Override
    public String getName() {
        return user.getGoogleId();
    }
}
