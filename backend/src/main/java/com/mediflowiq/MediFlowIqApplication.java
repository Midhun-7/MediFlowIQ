package com.mediflowiq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MediFlowIqApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediFlowIqApplication.class, args);
    }
}
