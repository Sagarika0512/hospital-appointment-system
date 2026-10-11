package com.sagarika.hospital.controller;

import com.sagarika.hospital.dto.DoctorRequest;
import com.sagarika.hospital.dto.DoctorResponse;
import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Doctors", description = "Endpoints for doctor directory and management")
@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Create Doctor -> 201 Created
    @Operation(summary = "Create a new doctor", description = "ADMIN only. Registers a new doctor into the hospital system.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Doctor created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    })
    @PostMapping
    public ResponseEntity<DoctorResponse> createDoctor(@Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.saveDoctor(request));
    }

    // Get All Doctors (Paginated) -> 200 OK
    @Operation(summary = "Get all doctors", description = "Public. Retrieves a paginated list of doctors.")
    @GetMapping
    public ResponseEntity<PagedResponse<DoctorResponse>> getAllDoctors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(doctorService.getAllDoctors(page, size, sortBy, sortDir));
    }

    // Get By ID -> 200 OK
    @Operation(summary = "Get doctor by ID", description = "Public. Retrieves detailed information for a specific doctor.")
    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    // Update -> 200 OK
    @Operation(summary = "Update doctor", description = "ADMIN only. Updates information of an existing doctor.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.ok(doctorService.updateDoctor(id, request));
    }

    // Delete -> 204 No Content
    @Operation(summary = "Delete doctor", description = "ADMIN only. Removes a doctor from the system.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
