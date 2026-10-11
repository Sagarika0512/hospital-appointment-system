package com.sagarika.hospital.controller;

import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.repository.UserRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AuthControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final List<String> createdUserEmails = new ArrayList<>();

    private String testUserEmail;
    private final String rawPassword = "Password@123";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();

        testUserEmail = "testuser_" + UUID.randomUUID().toString().substring(0, 8) + "@hospital.com";

        User user = new User();
        user.setName("Integration Test User");
        user.setEmail(testUserEmail);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("PATIENT");
        User savedUser = userRepository.save(user);
        createdUserEmails.add(testUserEmail);

        Patient patient = new Patient();
        patient.setName("Integration Test User");
        patient.setEmail(testUserEmail);
        patient.setUser(savedUser);
        patientRepository.save(patient);
    }

    @AfterEach
    void tearDown() {
        for (String email : createdUserEmails) {
            patientRepository.findByEmail(email).ifPresent(patientRepository::delete);
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
        createdUserEmails.clear();
    }

    @Test
    @DisplayName("Valid login returns 200 OK with JWT token and user details")
    void login_ValidCredentials_Success() throws Exception {
        String payload = String.format("""
                {
                    "email": "%s",
                    "password": "%s"
                }
                """, testUserEmail, rawPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(testUserEmail))
                .andExpect(jsonPath("$.role").value("PATIENT"))
                .andExpect(jsonPath("$.patientId").isNumber());
    }

    @Test
    @DisplayName("Login with invalid password returns 401 Unauthorized")
    void login_InvalidPassword_ReturnsUnauthorized() throws Exception {
        String payload = String.format("""
                {
                    "email": "%s",
                    "password": "WrongPassword!"
                }
                """, testUserEmail);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Login with non-existent email returns 401 Unauthorized")
    void login_NonExistentEmail_ReturnsUnauthorized() throws Exception {
        String payload = """
                {
                    "email": "nonexistent_404@hospital.com",
                    "password": "Password@123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Invalid login payload missing email returns 400 Bad Request")
    void login_MissingEmail_ReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "password": "Password@123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Invalid login payload missing password returns 400 Bad Request")
    void login_MissingPassword_ReturnsBadRequest() throws Exception {
        String payload = String.format("""
                {
                    "email": "%s"
                }
                """, testUserEmail);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint returns 401 or 403")
    void protectedEndpoint_Unauthenticated_Rejects() throws Exception {
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Valid registration creates new user and returns 201 Created")
    void register_ValidRequest_Success() throws Exception {
        String newEmail = "register_" + UUID.randomUUID().toString().substring(0, 8) + "@hospital.com";
        createdUserEmails.add(newEmail);

        String payload = String.format("""
                {
                    "name": "New Reg User",
                    "email": "%s",
                    "password": "Password@123"
                }
                """, newEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"));
    }
}
