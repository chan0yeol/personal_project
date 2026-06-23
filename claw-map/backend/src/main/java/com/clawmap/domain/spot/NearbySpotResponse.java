package com.clawmap.domain.spot;

public record NearbySpotResponse(
        Long id, String name, String address,
        Double lat, Double lng,
        double distanceMeters,
        double avgRating,
        long reviewCount,
        long likeCount
) {}
