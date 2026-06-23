package com.clawmap.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    // /uploads/** 경로로 업로드된 파일 정적 서빙
    // Path.toUri() 사용 → Windows(file:///D:/...) / Linux(file:/app/...) 모두 정상 처리
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String location = uploadPath.toUri().toString();
        if (!location.endsWith("/")) location += "/";
        log.info("업로드 파일 서빙 경로: {}", location);
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
