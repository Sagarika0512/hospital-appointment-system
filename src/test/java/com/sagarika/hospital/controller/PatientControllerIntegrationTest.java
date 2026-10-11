package com.sagarika.hospital.controller;

import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.repository.UserRepository;
import com.sagarika.hospital.security.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PatientControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final List<Long> createdPatientIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();

    private String adminToken;
    private String patientToken;
    private Patient testPatient;
    private User testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();

        adminToken = jwtUtil.generateToken("admin_patient_test@hospital.com", "ADMIN");
        patientToken = jwtUtil.generateToken("patient_patient_test@hospital.com", "PATIENT");

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        testUser = new User();
        testUser.setName("User " + uniqueSuffix);
        testUser.setEmail("user_" + uniqueSuffix + "@hospital.com");
        testUser.setPassword(passwordEncoder.encode("SecretPass!123"));
        testUser.setRole("PATIENT");
        testUser = userRepository.save(testUser);
        createdUserIds.add(testUser.getId());

        testPatient = new Patient();
        testPatient.setName("Patient " + uniqueSuffix);
        testPatient.setEmail("patient_" + uniqueSuffix + "@hospital.com");
        testPatient.setPhone("9876543210");
        testPatient.setDateOfBirth(LocalDate.of(1995, 5, 20));
        testPatient.setUser(testUser);
        testPatient = patientRepository.save(testPatient);
        createdPatientIds.add(testPatient.getId());
    }

    @AfterEach
    void tearDown() {
        for (Long id : createdPatientIds) {
            patientRepository.findById(id).ifPresent(patientRepository::delete);
        }
        createdPatientIds.clear();

        for (Long id : createdUserIds) {
            userRepository.findById(id).ifPresent(userRepository::delete);
        }
        createdUserIds.clear();
    }

    @Test
    @DisplayName("Admin GET /api/patients returns 200 OK with paginated DTO structure")
    void getAllPatients_AsAdmin_ReturnsPagedResponse() throws Exception {
        mockMvc.perform(get("/api/patients?page=0&size=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNo").value(0))
                .andExpect(jsonPath("$.pageSize").isNumber())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.last").isBoolean())
                // Ensure internal User entity/password is not exposed
                .andExpect(jsonPath("$.content[0].user").doesNotExist())
                .andExpect(jsonPath("$.content[0].password").doesNotExist());
    }

    @Test
    @DisplayName("Non-admin (PATIENT) cannot access GET /api/patients (403 Forbidden)")
    void getAllPatients_AsPatient_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/patients")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request cannot access GET /api/patients (401/403)")
    void getAllPatients_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/patients/{id} returns PatientResponse DTO without internal User entity")
    void getPatientById_ReturnsPatientDto() throws Exception {
        mockMvc.perform(get("/api/patients/" + testPatient.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPatient.getId()))
                .andExpect(jsonPath("$.name").value(testPatient.getName()))
                .andExpect(jsonPath("$.email").value(testPatient.getEmail()))
                .andExpect(jsonPath("$.phone").value(testPatient.getPhone()))
                .andExpect(jsonPath("$.dateOfBirth").exists())
                .andExpect(jsonPath("$.user").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("Invalid PatientRequest payload with blank name returns 400 Bad Request")
    void createPatient_InvalidPayload_ReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "name": "",
                    "email": "invalid_email_format",
                    "phone": "123"
                }
                """;

        mockMvc.perform(post("/api/patients")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
