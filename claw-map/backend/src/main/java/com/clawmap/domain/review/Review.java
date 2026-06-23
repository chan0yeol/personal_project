package com.clawmap.domain.review;

import com.clawmap.domain.image.ReviewImage;
import com.clawmap.domain.spot.Spot;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JSON 직렬화 시 Hibernate 프록시 오류 방지 (클라이언트에 spot 정보는 불필요)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spot_id", nullable = false)
    private Spot spot;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String nickname;

    // 로그인 유저가 작성한 경우 userId 저장 (비로그인 시 null)
    @Column(name = "user_id")
    private Long userId;

    // 리뷰 이미지 (최대 3장, 리뷰와 함께 항상 로드)
    @Builder.Default
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    private List<ReviewImage> images = new ArrayList<>();

    // 선택 입력 항목 (null = 미입력)
    private Integer rating;           // 별점 1~5
    private Integer playCount;        // 총 판 수
    private Integer spendAmount;      // 총 지출 (원)

    @Enumerated(EnumType.STRING)
    private CatchResult catchResult;  // 뽑기 결과

    @Enumerated(EnumType.STRING)
    private MachineCondition machineCondition; // 기계 컨디션

    private Boolean revisit;          // 재방문 의사

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum CatchResult   { SUCCESS, CLOSE, FAIL }
    public enum MachineCondition { GOOD, NORMAL, BAD }
}
