package com.chanyeols.dashboard.container.controller;

import com.chanyeols.dashboard.container.dto.ContainerSummaryDto;
import com.chanyeols.dashboard.container.service.ContainerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/containers")
@RequiredArgsConstructor
public class ContainerController {

    private final ContainerService containerService;

    @GetMapping
    public ResponseEntity<List<ContainerSummaryDto>> listContainers(
            @RequestParam(defaultValue = "true") boolean all) {
        return ResponseEntity.ok(containerService.listContainers(all));
    }

    @GetMapping("/{id}/logs")
    public SseEmitter streamLogs(@PathVariable String id,
                                 @RequestParam(defaultValue = "100") int tail) {
        return containerService.streamLogs(id, tail);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Void> start(@PathVariable String id) {
        containerService.startContainer(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<Void> stop(@PathVariable String id) {
        containerService.stopContainer(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/restart")
    public ResponseEntity<Void> restart(@PathVariable String id) {
        containerService.restartContainer(id);
        return ResponseEntity.ok().build();
    }
}
