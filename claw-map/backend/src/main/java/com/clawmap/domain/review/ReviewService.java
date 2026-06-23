package com.clawmap.domain.review;

import com.clawmap.domain.image.ReviewImage;
import com.clawmap.domain.image.ReviewImageRepository;
import com.clawmap.domain.like.LikeService;
import com.clawmap.domain.spot.SpotRepository;
import com.clawmap.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SpotRepository spotRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final LikeService likeService;
    private final UserRepository userRepository;

    // 스팟의 리뷰 목록 - 이미지 + 공감 + 프로필 포함
    public List<ReviewResponse> findBySpotId(Long spotId, String deviceId, Long userId) {
        return reviewRepository.findBySpotIdOrderByCreatedAtDesc(spotId).stream()
                .map(r -> {
                    String profileImageUrl = r.getUserId() != null
                            ? userRepository.findById(r.getUserId()).map(u -> u.getProfileImageUrl()).orElse(null)
                            : null;
                    return ReviewResponse.of(r,
                            likeService.getReviewLike(r.getId(), deviceId, userId).likeCount(),
                            likeService.getReviewLike(r.getId(), deviceId, userId).liked(),
                            profileImageUrl);
                })
                .toList();
    }

    // 마이페이지: 유저가 작성한 리뷰 목록
    public List<Review> findByUserId(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 리뷰 저장 - 로그인 시 userId 함께 저장
    @Transactional
    public void save(Long spotId, ReviewRequest request, Long userId) {
        var spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스팟입니다."));

        // 로그인 유저는 마이페이지에서 설정한 닉네임 사용, 비로그인은 요청값 사용
        String nickname = (userId != null)
                ? userRepository.findById(userId).map(u -> u.getNickname()).orElse(request.getNickname())
                : request.getNickname();

        Review review = reviewRepository.save(Review.builder()
                .spot(spot).content(request.getContent())
                .nickname(nickname).userId(userId)
                .rating(request.getRating())
                .playCount(request.getPlayCount())
                .spendAmount(request.getSpendAmount())
                .catchResult(request.getCatchResult())
                .machineCondition(request.getMachineCondition())
                .revisit(request.getRevisit())
                .build());

        List<String> imageUrls = request.getImageUrls();
        for (int i = 0; i < imageUrls.size(); i++) {
            reviewImageRepository.save(ReviewImage.builder()
                    .review(review).url(imageUrls.get(i)).displayOrder(i).build());
        }
    }

    // 리뷰 삭제 - 본인 리뷰만 가능
    @Transactional
    public void delete(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리뷰입니다."));
        if (!userId.equals(review.getUserId())) {
            throw new IllegalArgumentException("본인의 리뷰만 삭제할 수 있습니다.");
        }
        reviewRepository.delete(review);
    }
}
