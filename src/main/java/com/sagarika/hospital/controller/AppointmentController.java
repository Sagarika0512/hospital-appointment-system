package com.sagarika.hospital.controller;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Appointments", description = "Endpoints for appointment booking, viewing, cancellation, and completion")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // Helper: extract the single role string (e.g. "ROLE_ADMIN") from the auth object.
    private String getRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");
    }

    // ── CREATE ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Create an appointment", description = "Books an appointment slot. Role PATIENT auto-assigns the linked patient. Role ADMIN requires patientId. Double booking returns 409 Conflict.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Appointment created successfully"),
            @ApiResponse(responseCode = "400", description = "Past date or missing parameters"),
            @ApiResponse(responseCode = "409", description = "Doctor is already booked for this slot")
    })
    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication auth) {

        AppointmentResponse response = appointmentService.createAppointment(
                request,
                auth.getName(),   // authenticated user's email (from JWT)
                getRole(auth)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── GET ALL (PAGINATED) ────────────────────────────────────────────────────
    @Operation(summary = "Get all appointments", description = "Returns paginated appointments. Scoped to own appointments for PATIENT, or all for ADMIN.")
    @GetMapping
    public ResponseEntity<PagedResponse<AppointmentResponse>> getAllAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            Authentication auth) {
        return ResponseEntity.ok(
                appointmentService.getAllAppointments(auth.getName(), getRole(auth), page, size, sortBy, sortDir)
        );
    }

    // ── GET BY ID ──────────────────────────────────────────────────────────────
    @Operation(summary = "Get appointment by ID", description = "Retrieves appointment details. PATIENT can only access their own appointments.")
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(
                appointmentService.getAppointmentById(id, auth.getName(), getRole(auth))
        );
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Update appointment", description = "ADMIN only. Updates date, time, and reason of an existing appointment.")
    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, request));
    }

    // ── CANCEL ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Cancel appointment", description = "Cancels a SCHEDULED appointment. PATIENT can only cancel their own.")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(
                appointmentService.cancelAppointment(id, auth.getName(), getRole(auth))
        );
    }

    // ── COMPLETE ───────────────────────────────────────────────────────────────
    @Operation(summary = "Mark appointment complete", description = "ADMIN only. Marks a SCHEDULED appointment as COMPLETED.")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Delete appointment", description = "ADMIN only. Permanently deletes an appointment.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
