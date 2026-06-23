package com.chanyeols.dashboard.container.service;

import com.chanyeols.dashboard.container.dto.ContainerSummaryDto;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Frame;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContainerService {

    private final DockerClient dockerClient;

    public List<ContainerSummaryDto> listContainers(boolean all) {
        return dockerClient.listContainersCmd()
                .withShowAll(all)
                .exec()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public SseEmitter streamLogs(String containerId, int tail) {
        SseEmitter emitter = new SseEmitter(0L);

        Thread thread = new Thread(() -> {
            try {
                ResultCallback.Adapter<Frame> callback = dockerClient.logContainerCmd(containerId)
                        .withStdOut(true)
                        .withStdErr(true)
                        .withFollowStream(true)
                        .withTail(tail)
                        .withTimestamps(true)
                        .exec(new ResultCallback.Adapter<>() {
                            @Override
                            public void onNext(Frame frame) {
                                String line = new String(frame.getPayload()).stripTrailing();
                                if (line.isEmpty()) return;
                                try {
                                    emitter.send(SseEmitter.event().data(line));
                                } catch (Exception e) {
                                    emitter.completeWithError(e);
                                }
                            }
                            @Override
                            public void onError(Throwable t) { emitter.completeWithError(t); }
                            @Override
                            public void onComplete() { emitter.complete(); }
                        });
                callback.awaitCompletion();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        thread.setDaemon(true);
        thread.start();
        emitter.onCompletion(thread::interrupt);
        emitter.onTimeout(thread::interrupt);

        return emitter;
    }

    public void startContainer(String containerId) {
        dockerClient.startContainerCmd(containerId).exec();
        log.info("Container started: {}", containerId);
    }

    public void stopContainer(String containerId) {
        dockerClient.stopContainerCmd(containerId).exec();
        log.info("Container stopped: {}", containerId);
    }

    public void restartContainer(String containerId) {
        dockerClient.restartContainerCmd(containerId).exec();
        log.info("Container restarted: {}", containerId);
    }

    private ContainerSummaryDto toDto(Container container) {
        return ContainerSummaryDto.builder()
                .id(container.getId())
                .shortId(container.getId().substring(0, 12))
                .names(Arrays.asList(container.getNames()))
                .image(container.getImage())
                .status(container.getStatus())
                .state(container.getState())
                .created(container.getCreated())
                .build();
    }
}
