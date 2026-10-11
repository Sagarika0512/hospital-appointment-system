package com.sagarika.hospital.controller;

import com.sagarika.hospital.entity.*;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
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
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AppointmentControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final List<Long> createdAppointmentIds = new ArrayList<>();
    private final List<Long> createdPatientIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdDoctorIds = new ArrayList<>();

    private Doctor testDoctor;
    private User patientUser1;
    private Patient patient1;
    private String patient1Token;

    private User patientUser2;
    private Patient patient2;
    private String patient2Token;

    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain)
                .build();

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Create Doctor
        testDoctor = new Doctor();
        testDoctor.setName("Dr. Appointment Test " + uniqueSuffix);
        testDoctor.setSpecialization("Cardiology");
        testDoctor.setEmail("dr_appt_" + uniqueSuffix + "@hospital.com");
        testDoctor.setPhone("1234567890");
        testDoctor = doctorRepository.save(testDoctor);
        createdDoctorIds.add(testDoctor.getId());

        // 2. Create Patient 1 & User 1
        String email1 = "pat1_" + uniqueSuffix + "@hospital.com";
        patientUser1 = new User();
        patientUser1.setName("Patient One");
        patientUser1.setEmail(email1);
        patientUser1.setPassword(passwordEncoder.encode("Pass123!"));
        patientUser1.setRole("PATIENT");
        patientUser1 = userRepository.save(patientUser1);
        createdUserIds.add(patientUser1.getId());

        patient1 = new Patient();
        patient1.setName("Patient One");
        patient1.setEmail(email1);
        patient1.setUser(patientUser1);
        patient1 = patientRepository.save(patient1);
        createdPatientIds.add(patient1.getId());

        patient1Token = jwtUtil.generateToken(email1, "PATIENT");

        // 3. Create Patient 2 & User 2
        String email2 = "pat2_" + uniqueSuffix + "@hospital.com";
        patientUser2 = new User();
        patientUser2.setName("Patient Two");
        patientUser2.setEmail(email2);
        patientUser2.setPassword(passwordEncoder.encode("Pass123!"));
        patientUser2.setRole("PATIENT");
        patientUser2 = userRepository.save(patientUser2);
        createdUserIds.add(patientUser2.getId());

        patient2 = new Patient();
        patient2.setName("Patient Two");
        patient2.setEmail(email2);
        patient2.setUser(patientUser2);
        patient2 = patientRepository.save(patient2);
        createdPatientIds.add(patient2.getId());

        patient2Token = jwtUtil.generateToken(email2, "PATIENT");

        // 4. Admin token
        adminToken = jwtUtil.generateToken("admin_" + uniqueSuffix + "@hospital.com", "ADMIN");
    }

    @AfterEach
    void tearDown() {
        // Safe order: Appointments -> Patients -> Users -> Doctors
        for (Long id : createdAppointmentIds) {
            appointmentRepository.findById(id).ifPresent(appointmentRepository::delete);
        }
        createdAppointmentIds.clear();

        for (Long id : createdPatientIds) {
            patientRepository.findById(id).ifPresent(patientRepository::delete);
        }
        createdPatientIds.clear();

        for (Long id : createdUserIds) {
            userRepository.findById(id).ifPresent(userRepository::delete);
        }
        createdUserIds.clear();

        for (Long id : createdDoctorIds) {
            doctorRepository.findById(id).ifPresent(doctorRepository::delete);
        }
        createdDoctorIds.clear();
    }

    private Appointment createScheduledAppointment(Patient patient, LocalDate date, LocalTime time) {
        Appointment appt = new Appointment();
        appt.setDoctor(testDoctor);
        appt.setPatient(patient);
        appt.setAppointmentDate(date);
        appt.setAppointmentTime(time);
        appt.setReason("Checkup");
        appt.setStatus(AppointmentStatus.SCHEDULED);
        appt = appointmentRepository.save(appt);
        createdAppointmentIds.add(appt.getId());
        return appt;
    }

    @Test
    @DisplayName("Authenticated patient can create an appointment (201 Created)")
    void createAppointment_AsPatient_ReturnsCreated() throws Exception {
        LocalDate date = LocalDate.now().plusDays(10);
        String payload = String.format("""
                {
                    "doctorId": %d,
                    "appointmentDate": "%s",
                    "appointmentTime": "11:00:00",
                    "reason": "Integration Test Checkup"
                }
                """, testDoctor.getId(), date);

        String response = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + patient1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.doctorName").value(testDoctor.getName()))
                .andExpect(jsonPath("$.patientName").value(patient1.getName()))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn().getResponse().getContentAsString();

        Number createdId = com.jayway.jsonpath.JsonPath.read(response, "$.id");
        createdAppointmentIds.add(createdId.longValue());
    }

    @Test
    @DisplayName("Past-date appointment returns 400 Bad Request")
    void createAppointment_PastDate_ReturnsBadRequest() throws Exception {
        LocalDate pastDate = LocalDate.now().minusDays(2);
        String payload = String.format("""
                {
                    "doctorId": %d,
                    "appointmentDate": "%s",
                    "appointmentTime": "11:00:00",
                    "reason": "Past date attempt"
                }
                """, testDoctor.getId(), pastDate);

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + patient1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot book an appointment in the past"));
    }

    @Test
    @DisplayName("Duplicate appointment for same doctor/date/time returns 409 Conflict")
    void createAppointment_Duplicate_ReturnsConflict() throws Exception {
        LocalDate date = LocalDate.now().plusDays(15);
        LocalTime time = LocalTime.of(14, 0);

        createScheduledAppointment(patient1, date, time);

        // Patient 2 attempts booking same doctor and slot
        String payload = String.format("""
                {
                    "doctorId": %d,
                    "appointmentDate": "%s",
                    "appointmentTime": "14:00:00",
                    "reason": "Double booking attempt"
                }
                """, testDoctor.getId(), date);

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + patient2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Doctor is already booked for this time slot"));
    }

    @Test
    @DisplayName("Patient cannot access another patient's appointment (403 Forbidden)")
    void getAppointmentById_OtherPatient_ReturnsForbidden() throws Exception {
        LocalDate date = LocalDate.now().plusDays(20);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(9, 0));

        // Patient 2 attempts accessing Patient 1's appointment
        mockMvc.perform(get("/api/appointments/" + appt.getId())
                        .header("Authorization", "Bearer " + patient2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not allowed to view this appointment"));
    }

    @Test
    @DisplayName("Admin can view any patient's appointment (200 OK)")
    void getAppointmentById_AsAdmin_ReturnsOk() throws Exception {
        LocalDate date = LocalDate.now().plusDays(20);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(9, 30));

        mockMvc.perform(get("/api/appointments/" + appt.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appt.getId()))
                .andExpect(jsonPath("$.patientName").value(patient1.getName()));
    }

    @Test
    @DisplayName("Patient can cancel their own scheduled appointment (200 OK)")
    void cancelAppointment_OwnAppointment_ReturnsOk() throws Exception {
        LocalDate date = LocalDate.now().plusDays(22);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(10, 0));

        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("Patient cannot cancel another patient's appointment (403 Forbidden)")
    void cancelAppointment_OtherPatient_ReturnsForbidden() throws Exception {
        LocalDate date = LocalDate.now().plusDays(22);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(10, 30));

        // Patient 2 attempts cancelling Patient 1's appointment
        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + patient2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not allowed to cancel this appointment"));
    }

    @Test
    @DisplayName("Admin can complete a scheduled appointment (200 OK)")
    void completeAppointment_AsAdmin_ReturnsOk() throws Exception {
        LocalDate date = LocalDate.now().plusDays(25);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(11, 0));

        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/complete")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("Patient cannot complete an appointment (403 Forbidden)")
    void completeAppointment_AsPatient_ReturnsForbidden() throws Exception {
        LocalDate date = LocalDate.now().plusDays(25);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(11, 30));

        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/complete")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cancelling an already CANCELLED appointment returns 400 Bad Request")
    void cancelAppointment_AlreadyCancelled_ReturnsBadRequest() throws Exception {
        LocalDate date = LocalDate.now().plusDays(26);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(12, 0));
        appt.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);

        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Only SCHEDULED appointments can be cancelled")));
    }

    @Test
    @DisplayName("Completing an already COMPLETED appointment returns 400 Bad Request")
    void completeAppointment_AlreadyCompleted_ReturnsBadRequest() throws Exception {
        LocalDate date = LocalDate.now().plusDays(27);
        Appointment appt = createScheduledAppointment(patient1, date, LocalTime.of(12, 30));
        appt.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appt);

        mockMvc.perform(patch("/api/appointments/" + appt.getId() + "/complete")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Only SCHEDULED appointments can be completed")));
    }

    @Test
    @DisplayName("GET /api/appointments returns correctly structured PagedResponse")
    void getAllAppointments_PagedResponseValidation() throws Exception {
        LocalDate date = LocalDate.now().plusDays(30);
        createScheduledAppointment(patient1, date, LocalTime.of(15, 0));

        mockMvc.perform(get("/api/appointments?page=0&size=5")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNo").value(0))
                .andExpect(jsonPath("$.pageSize").isNumber())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.last").isBoolean())
                .andExpect(jsonPath("$.content[0].doctorName").exists())
                .andExpect(jsonPath("$.content[0].patientName").exists())
                .andExpect(jsonPath("$.content[0].status").exists());
    }
}
