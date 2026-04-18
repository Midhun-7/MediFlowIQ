package com.mediflowiq.controller;

import com.mediflowiq.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Phase 5 — Notification history REST endpoint.
 * GET /api/notifications  — returns the last 50 in-memory notifications (newest last).
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationService.Notification>> getHistory() {
        return ResponseEntity.ok(notificationService.getHistory());
    }
}
