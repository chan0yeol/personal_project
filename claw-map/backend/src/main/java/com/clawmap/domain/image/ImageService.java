package com.clawmap.domain.image;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class ImageService {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 1200;

    // 파일 저장 후 접근 URL 반환 (1200px 초과 시 리사이징)
    public String save(MultipartFile file) throws IOException {
        validateFile(file);

        // 저장 포맷은 jpeg로 통일 (webp/png 포함)
        String filename = UUID.randomUUID() + ".jpg";

        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);

        try (OutputStream out = Files.newOutputStream(dir.resolve(filename))) {
            Thumbnails.of(file.getInputStream())
                    .size(MAX_WIDTH, MAX_HEIGHT)
                    .outputFormat("jpg")
                    .outputQuality(0.85)
                    .toOutputStream(out);
        }
        log.info("이미지 저장 (리사이징 적용): {}", filename);

        return "/uploads/" + filename;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다.");
        }
        String ext = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. (jpg, png, webp 가능)");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : "";
    }
}
