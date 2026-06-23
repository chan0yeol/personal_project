---
title: "Spring Boot 예외 처리 통일하기 — @ControllerAdvice와 @ExceptionHandler"
date: 2026-03-17T21:00:00+09:00
categories: []
tags: []
draft: false
---

## 1. 서론: 왜 예외 처리를 통일해야 하는가?
API를 개발하다 보면 다양한 예외 상황이 발생합니다. 데이터가 없는 경우, 입력값이 잘못된 경우, 서버 내부 로직 오류 등이 대표적입니다. 이때 각 컨트롤러에서 `try-catch`로 예외를 개별 처리하면 다음과 같은 문제가 발생합니다.

1. **코드 중복**: 비슷한 예외 처리 로직이 여러 컨트롤러에 반복됩니다.
2. **응답 일관성 부족**: 어떤 API는 JSON으로 에러를 주는데, 어떤 API는 HTML 에러 페이지를 주는 등 응답 형식이 제각각이 됩니다.
3. **비즈니스 로직 집중도 저하**: 예외 처리 코드가 섞여 있어 핵심 로직을 파악하기 힘듭니다.

Spring은 이를 우아하게 해결할 수 있도록 **@ControllerAdvice**와 **@ExceptionHandler**를 제공합니다.

## 2. 핵심 어노테이션 이해하기

### 2.1. @ExceptionHandler
특정 컨트롤러 내부에서 발생하는 특정 예외를 잡아 처리하는 메서드를 정의합니다. 해당 컨트롤러 안에서만 유효하다는 특징이 있습니다.

### 2.2. @RestControllerAdvice (@ControllerAdvice)
여러 컨트롤러에서 발생하는 예외를 한곳에서 전역적으로 처리할 수 있게 해주는 "공통 관심사" 클래스입니다. `@RestControllerAdvice`는 `@ResponseBody`가 포함되어 있어 JSON 형태로 에러를 응답하기에 적합합니다.

## 3. 실무적인 공통 예외 처리 구현

### 3.1. 에러 응답 규격 정의 (ErrorResponse)
모든 에러 응답은 동일한 구조를 가져야 클라이언트(프론트엔드)에서 처리하기 쉽습니다.

```java
@Getter
@Builder
public class ErrorResponse {
    private final LocalDateTime timestamp = LocalDateTime.now();
    private final int status;
    private final String error;
    private final String code;
    private final String message;
}
```

### 3.2. 전역 예외 처리기 구현 (GlobalExceptionHandler)
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 모든 비즈니스 예외 처리
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        log.error("handleBusinessException", e);
        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse response = ErrorResponse.builder()
                .status(errorCode.getStatus())
                .error(errorCode.name())
                .code(errorCode.getCode())
                .message(e.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.valueOf(errorCode.getStatus()));
    }

    // 그 외 예상치 못한 모든 예외 처리
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("handleException", e);
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .code("COMMON-001")
                .message(e.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## 4. 사용자 정의 예외(Custom Exception) 활용
단순히 `RuntimeException`을 던지기보다, 도메인의 의미를 담은 사용자 정의 예외를 만드는 것이 좋습니다.

```java
@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}

// 예외 상황에 따른 코드 정의
@Getter
public enum ErrorCode {
    USER_NOT_FOUND(404, "U001", "사용자를 찾을 수 없습니다."),
    INVALID_INPUT_VALUE(400, "C001", "잘못된 입력값입니다.");

    private final int status;
    private final String code;
    private final String message;

    ErrorCode(int status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
```

## 5. 결론: 일관된 에러 응답의 가치
공통 예외 처리를 구축하면 개발자는 비즈니스 로직에서 `throw new UserNotFoundException()`처럼 예외를 던지기만 하면 됩니다. 나머지는 `@RestControllerAdvice`가 알아서 처리하여 일관된 JSON 응답을 클라이언트에 전달합니다.

이러한 구조는 코드의 가독성을 높일 뿐만 아니라, 프론트엔드와의 협업 효율성을 극대화하는 핵심적인 설계 패턴입니다. 지금 바로 프로젝트의 예외 처리 로직을 리팩토링해 보세요!
