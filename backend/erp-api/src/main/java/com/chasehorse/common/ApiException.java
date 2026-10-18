package com.chasehorse.common;

import org.springframework.http.HttpStatus;

/**
 * Base application exception. Carries an HTTP status code so the global handler
 * can map domain errors to proper HTTP responses without leaking internals.
 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public ApiException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }

    /* Convenience factories */

    public static ApiException notFound(String entity, Object id) {
        return new ApiException(HttpStatus.NOT_FOUND, entity + " not found: " + id);
    }

    public static ApiException forbidden(String reason) {
        return new ApiException(HttpStatus.FORBIDDEN, reason);
    }

    public static ApiException badRequest(String reason) {
        return new ApiException(HttpStatus.BAD_REQUEST, reason);
    }

    public static ApiException conflict(String reason) {
        return new ApiException(HttpStatus.CONFLICT, reason);
    }
}
