package com.clawmap.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGoogleId(String googleId);

    // 닉네임 중복 체크 - 본인 제외
    boolean existsByNicknameAndIdNot(String nickname, Long id);
}
