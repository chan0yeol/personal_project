package com.clawmap.domain.like;

// 좋아요 토글 후 클라이언트에 반환하는 응답
public record LikeResponse(boolean liked, long likeCount) {}
