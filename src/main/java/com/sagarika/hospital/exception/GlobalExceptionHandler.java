package com.sagarika.hospital.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    //Handle Validation Errors
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        log.debug("Validation failed on request: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    //Handle Resource Not Found (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.info("Resource not found: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("status", "404");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    //Handle Appointment Conflict / Double Booking (409)
    @ExceptionHandler(AppointmentConflictException.class)
    public ResponseEntity<Map<String, String>> handleAppointmentConflictException(AppointmentConflictException ex) {
        log.warn("Appointment conflict: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("status", "409");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    //Handle Database Unique Constraint Violations (409)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        log.warn("Data integrity unique constraint violation occurred");
        Map<String, String> error = new HashMap<>();
        error.put("message", "Doctor is already booked for this time slot");
        error.put("status", "409");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    //Handle Custom Thrown ResponseStatusException
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        log.info("ResponseStatusException handled: status={}, reason={}", ex.getStatusCode(), ex.getReason());
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getReason());
        error.put("status", String.valueOf(ex.getStatusCode().value()));

        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    //Handle Generic Unexpected Internal Server Errors (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("Unhandled internal server error occurred", ex);
        Map<String, String> error = new HashMap<>();
        error.put("message", "An unexpected internal error occurred. Please contact system support.");
        error.put("status", "500");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}