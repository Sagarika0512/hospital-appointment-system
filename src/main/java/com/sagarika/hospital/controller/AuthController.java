package com.sagarika.hospital.controller;

import com.sagarika.hospital.dto.LoginRequest;
import com.sagarika.hospital.dto.LoginResponse;
import com.sagarika.hospital.dto.RegisterRequest;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.security.JwtUtil;
import com.sagarika.hospital.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Authentication", description = "Endpoints for user registration and JWT authentication")
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PatientRepository patientRepository;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil, PatientRepository patientRepository) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.patientRepository = patientRepository;
    }

    // Register a new user
    @Operation(summary = "Register a new user", description = "Registers a new patient account with encrypted password.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error or email already in use")
    })
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole("PATIENT"); // Always PATIENT — admin accounts must be created manually

        userService.saveUser(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Login an existing user
    @Operation(summary = "Authenticate user login", description = "Authenticates user credentials and issues a JWT Bearer token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "401", description = "Invalid email or password")
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {

        User user = userService.getUserByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"
                ));

        // Compare the provided password with the hashed password in the database
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        // Generate a JWT token for this user
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        LoginResponse response = new LoginResponse(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole()
        );

        // Populate patientId for PATIENT users so the frontend can reference
        // their linked patient record. ADMIN users will receive null.
        patientRepository.findByUserId(user.getId())
                .ifPresent(p -> response.setPatientId(p.getId()));

        return ResponseEntity.ok(response);
    }
}
