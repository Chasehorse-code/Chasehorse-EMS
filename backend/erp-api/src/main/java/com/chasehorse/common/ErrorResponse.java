package com.chasehorse.common;

import java.time.OffsetDateTime;

/**
 * Uniform error response body. Matches the structure expected by the frontend
 * {@code ApiError} class.
 */
public record ErrorResponse(
    int status,
    String error,
    String message,
    String timestamp
) {
    public ErrorResponse(int status, String error, String message) {
        this(status, error, message, OffsetDateTime.now().toString());
    }
}
