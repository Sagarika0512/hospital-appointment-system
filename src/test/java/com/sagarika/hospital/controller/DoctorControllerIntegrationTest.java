package com.sagarika.hospital.controller;

import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.security.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class DoctorControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final List<Long> createdDoctorIds = new ArrayList<>();
    private String adminToken;
    private String patientToken;
    private Doctor testDoctor;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();

        adminToken = jwtUtil.generateToken("admin_test@hospital.com", "ADMIN");
        patientToken = jwtUtil.generateToken("patient_test@hospital.com", "PATIENT");

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        testDoctor = new Doctor();
        testDoctor.setName("Dr. Test " + uniqueSuffix);
        testDoctor.setSpecialization("Orthopedics");
        testDoctor.setEmail("dr_" + uniqueSuffix + "@hospital.com");
        testDoctor.setPhone("1234567890");
        testDoctor = doctorRepository.save(testDoctor);
        createdDoctorIds.add(testDoctor.getId());
    }

    @AfterEach
    void tearDown() {
        for (Long id : createdDoctorIds) {
            doctorRepository.findById(id).ifPresent(doctorRepository::delete);
        }
        createdDoctorIds.clear();
    }

    @Test
    @DisplayName("Public GET /api/doctors returns 200 OK with paginated DTO structure")
    void getAllDoctors_Public_ReturnsPagedResponse() throws Exception {
        mockMvc.perform(get("/api/doctors?page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNo").value(0))
                .andExpect(jsonPath("$.pageSize").isNumber())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.last").isBoolean())
                // Verify DTO fields (no raw internal entity fields)
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].name").exists())
                .andExpect(jsonPath("$.content[0].specialization").exists());
    }

    @Test
    @DisplayName("GET /api/doctors/{id} returns DoctorResponse DTO")
    void getDoctorById_ReturnsDoctorDto() throws Exception {
        mockMvc.perform(get("/api/doctors/" + testDoctor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testDoctor.getId()))
                .andExpect(jsonPath("$.name").value(testDoctor.getName()))
                .andExpect(jsonPath("$.specialization").value(testDoctor.getSpecialization()))
                .andExpect(jsonPath("$.email").value(testDoctor.getEmail()))
                .andExpect(jsonPath("$.phone").value(testDoctor.getPhone()));
    }

    @Test
    @DisplayName("Admin can create new doctor via POST /api/doctors (201 Created)")
    void createDoctor_AsAdmin_ReturnsCreated() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String payload = String.format("""
                {
                    "name": "Dr. Created %s",
                    "specialization": "Dermatology",
                    "email": "created_%s@hospital.com",
                    "phone": "9876543210"
                }
                """, uniqueSuffix, uniqueSuffix);

        String responseContent = mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Dr. Created " + uniqueSuffix))
                .andExpect(jsonPath("$.specialization").value("Dermatology"))
                .andReturn().getResponse().getContentAsString();

        Number createdId = com.jayway.jsonpath.JsonPath.read(responseContent, "$.id");
        createdDoctorIds.add(createdId.longValue());
    }

    @Test
    @DisplayName("Non-admin (PATIENT) cannot create doctor (403 Forbidden)")
    void createDoctor_AsPatient_ReturnsForbidden() throws Exception {
        String payload = """
                {
                    "name": "Dr. Unauthorized",
                    "specialization": "General",
                    "email": "unauth@hospital.com",
                    "phone": "1112223334"
                }
                """;

        mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request cannot create doctor (401/403)")
    void createDoctor_Unauthenticated_ReturnsUnauthorized() throws Exception {
        String payload = """
                {
                    "name": "Dr. Unauth",
                    "specialization": "General",
                    "email": "noauth@hospital.com",
                    "phone": "1112223334"
                }
                """;

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can update existing doctor via PUT /api/doctors/{id}")
    void updateDoctor_AsAdmin_ReturnsUpdated() throws Exception {
        String payload = String.format("""
                {
                    "name": "Dr. Updated Name",
                    "specialization": "Updated Spec",
                    "email": "%s",
                    "phone": "9998887776"
                }
                """, testDoctor.getEmail());

        mockMvc.perform(put("/api/doctors/" + testDoctor.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dr. Updated Name"))
                .andExpect(jsonPath("$.specialization").value("Updated Spec"));
    }

    @Test
    @DisplayName("Admin can delete doctor via DELETE /api/doctors/{id} (204 No Content)")
    void deleteDoctor_AsAdmin_ReturnsNoContent() throws Exception {
        Doctor toDelete = new Doctor();
        toDelete.setName("Dr. To Delete");
        toDelete.setSpecialization("Radiology");
        toDelete.setEmail("delete_" + UUID.randomUUID().toString().substring(0, 8) + "@hospital.com");
        toDelete.setPhone("5554443332");
        toDelete = doctorRepository.save(toDelete);

        mockMvc.perform(delete("/api/doctors/" + toDelete.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
