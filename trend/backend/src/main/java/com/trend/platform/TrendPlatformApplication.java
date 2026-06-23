package com.trend.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrendPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(TrendPlatformApplication.class, args);
    }
}
