package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.AppointmentStatus;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.exception.AppointmentConflictException;
import com.sagarika.hospital.exception.ResourceNotFoundException;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepo;

    @Mock
    private PatientRepository patientRepo;

    @Mock
    private DoctorRepository doctorRepo;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor sampleDoctor;
    private Patient samplePatient;
    private User sampleUser;
    private AppointmentRequest validRequest;

    @BeforeEach
    void setUp() {
        sampleDoctor = new Doctor();
        sampleDoctor.setId(10L);
        sampleDoctor.setName("Dr. Test");
        sampleDoctor.setEmail("dr.test@hospital.com");
        sampleDoctor.setSpecialization("Cardiology");
        sampleDoctor.setPhone("1234567890");

        sampleUser = new User();
        sampleUser.setId(20L);
        sampleUser.setName("Patient Test");
        sampleUser.setEmail("patient.test@hospital.com");
        sampleUser.setRole("PATIENT");

        samplePatient = new Patient();
        samplePatient.setId(30L);
        samplePatient.setName("Patient Test");
        samplePatient.setEmail("patient.test@hospital.com");
        samplePatient.setUser(sampleUser);

        validRequest = new AppointmentRequest();
        validRequest.setDoctorId(10L);
        validRequest.setAppointmentDate(LocalDate.now().plusDays(5));
        validRequest.setAppointmentTime(LocalTime.of(10, 0));
        validRequest.setReason("Routine Checkup");
    }

    // ── CREATE APPOINTMENT TESTS ─────────────────────────────────────────────

    @Test
    @DisplayName("Patient can successfully create an appointment for their linked account")
    void createAppointment_AsPatient_Success() {
        when(patientRepo.findByUserEmail("patient.test@hospital.com"))
                .thenReturn(Optional.of(samplePatient));
        when(doctorRepo.findById(10L))
                .thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                10L, validRequest.getAppointmentDate(), validRequest.getAppointmentTime()))
                .thenReturn(false);

        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(100L);
        savedAppointment.setDoctor(sampleDoctor);
        savedAppointment.setPatient(samplePatient);
        savedAppointment.setAppointmentDate(validRequest.getAppointmentDate());
        savedAppointment.setAppointmentTime(validRequest.getAppointmentTime());
        savedAppointment.setReason("Routine Checkup");
        savedAppointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponse response = appointmentService.createAppointment(
                validRequest, "patient.test@hospital.com", "ROLE_PATIENT");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getDoctorName()).isEqualTo("Dr. Test");
        assertThat(response.getPatientName()).isEqualTo("Patient Test");
        assertThat(response.getStatus()).isEqualTo("SCHEDULED");
        verify(appointmentRepo, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Creating appointment with past date throws 400 Bad Request")
    void createAppointment_PastDate_ThrowsBadRequest() {
        AppointmentRequest pastRequest = new AppointmentRequest();
        pastRequest.setDoctorId(10L);
        pastRequest.setAppointmentDate(LocalDate.now().minusDays(1));
        pastRequest.setAppointmentTime(LocalTime.of(10, 0));
        pastRequest.setReason("Past date test");

        assertThatThrownBy(() -> appointmentService.createAppointment(
                pastRequest, "patient.test@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Cannot book an appointment in the past");
                });

        verifyNoInteractions(appointmentRepo);
    }

    @Test
    @DisplayName("Duplicate appointment pre-check throws 409 AppointmentConflictException")
    void createAppointment_DuplicateSlot_ThrowsConflictException() {
        when(patientRepo.findByUserEmail("patient.test@hospital.com"))
                .thenReturn(Optional.of(samplePatient));
        when(doctorRepo.findById(10L))
                .thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                10L, validRequest.getAppointmentDate(), validRequest.getAppointmentTime()))
                .thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment(
                validRequest, "patient.test@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(AppointmentConflictException.class)
                .hasMessageContaining("Doctor is already booked for this time slot");

        verify(appointmentRepo, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Database unique constraint violation during save throws 409 AppointmentConflictException")
    void createAppointment_DataIntegrityViolation_ThrowsConflictException() {
        when(patientRepo.findByUserEmail("patient.test@hospital.com"))
                .thenReturn(Optional.of(samplePatient));
        when(doctorRepo.findById(10L))
                .thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                10L, validRequest.getAppointmentDate(), validRequest.getAppointmentTime()))
                .thenReturn(false);
        when(appointmentRepo.save(any(Appointment.class)))
                .thenThrow(new DataIntegrityViolationException("uk_doctor_date_time violated"));

        assertThatThrownBy(() -> appointmentService.createAppointment(
                validRequest, "patient.test@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(AppointmentConflictException.class)
                .hasMessageContaining("Doctor is already booked for this time slot");
    }

    @Test
    @DisplayName("Patient without linked patient profile throws 403 Forbidden")
    void createAppointment_PatientWithNoProfile_ThrowsForbidden() {
        when(patientRepo.findByUserEmail("unknown@hospital.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.createAppointment(
                validRequest, "unknown@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("No patient profile is linked to your account");
                });
    }

    @Test
    @DisplayName("Admin can create appointment for another patient when patientId is provided")
    void createAppointment_AsAdmin_WithPatientId_Success() {
        validRequest.setPatientId(30L);
        when(patientRepo.findById(30L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepo.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                10L, validRequest.getAppointmentDate(), validRequest.getAppointmentTime()))
                .thenReturn(false);

        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(101L);
        savedAppointment.setDoctor(sampleDoctor);
        savedAppointment.setPatient(samplePatient);
        savedAppointment.setAppointmentDate(validRequest.getAppointmentDate());
        savedAppointment.setAppointmentTime(validRequest.getAppointmentTime());
        savedAppointment.setReason("Admin booked");
        savedAppointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponse response = appointmentService.createAppointment(
                validRequest, "admin@hospital.com", "ROLE_ADMIN");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(101L);
        assertThat(response.getPatientName()).isEqualTo("Patient Test");
        verify(patientRepo).findById(30L);
    }

    @Test
    @DisplayName("Admin creating appointment without patientId throws 400 Bad Request")
    void createAppointment_AsAdmin_WithoutPatientId_ThrowsBadRequest() {
        validRequest.setPatientId(null);

        assertThatThrownBy(() -> appointmentService.createAppointment(
                validRequest, "admin@hospital.com", "ROLE_ADMIN"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("ADMIN must provide a patientId");
                });
    }

    // ── CANCEL APPOINTMENT TESTS ─────────────────────────────────────────────

    @Test
    @DisplayName("Patient can cancel their own scheduled appointment")
    void cancelAppointment_OwnScheduledAppointment_Success() {
        Appointment appointment = new Appointment();
        appointment.setId(50L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.findById(50L)).thenReturn(Optional.of(appointment));
        when(appointmentRepo.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response = appointmentService.cancelAppointment(
                50L, "patient.test@hospital.com", "ROLE_PATIENT");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        verify(appointmentRepo).save(appointment);
    }

    @Test
    @DisplayName("Patient cannot cancel another patient's appointment (throws 403)")
    void cancelAppointment_OtherPatientAppointment_ThrowsForbidden() {
        Appointment appointment = new Appointment();
        appointment.setId(50L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient); // owner is patient.test@hospital.com
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.findById(50L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelAppointment(
                50L, "intruder@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("You are not allowed to cancel this appointment");
                });

        verify(appointmentRepo, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Admin can cancel any patient's scheduled appointment")
    void cancelAppointment_AsAdmin_Success() {
        Appointment appointment = new Appointment();
        appointment.setId(50L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.findById(50L)).thenReturn(Optional.of(appointment));
        when(appointmentRepo.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response = appointmentService.cancelAppointment(
                50L, "admin@hospital.com", "ROLE_ADMIN");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(appointmentRepo).save(appointment);
    }

    @Test
    @DisplayName("Cannot cancel an already CANCELLED appointment (throws 400)")
    void cancelAppointment_AlreadyCancelled_ThrowsBadRequest() {
        Appointment appointment = new Appointment();
        appointment.setId(50L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.CANCELLED);

        when(appointmentRepo.findById(50L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelAppointment(
                50L, "patient.test@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Only SCHEDULED appointments can be cancelled");
                });
    }

    @Test
    @DisplayName("Cannot cancel an already COMPLETED appointment (throws 400)")
    void cancelAppointment_AlreadyCompleted_ThrowsBadRequest() {
        Appointment appointment = new Appointment();
        appointment.setId(50L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.COMPLETED);

        when(appointmentRepo.findById(50L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelAppointment(
                50L, "patient.test@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Only SCHEDULED appointments can be cancelled");
                });
    }

    // ── COMPLETE APPOINTMENT TESTS ───────────────────────────────────────────

    @Test
    @DisplayName("Admin can complete a scheduled appointment")
    void completeAppointment_Scheduled_Success() {
        Appointment appointment = new Appointment();
        appointment.setId(60L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepo.findById(60L)).thenReturn(Optional.of(appointment));
        when(appointmentRepo.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response = appointmentService.completeAppointment(60L);

        assertThat(response.getStatus()).isEqualTo("COMPLETED");
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        verify(appointmentRepo).save(appointment);
    }

    @Test
    @DisplayName("Completing a non-SCHEDULED appointment throws 400 Bad Request")
    void completeAppointment_Cancelled_ThrowsBadRequest() {
        Appointment appointment = new Appointment();
        appointment.setId(60L);
        appointment.setDoctor(sampleDoctor);
        appointment.setPatient(samplePatient);
        appointment.setStatus(AppointmentStatus.CANCELLED);

        when(appointmentRepo.findById(60L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.completeAppointment(60L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Only SCHEDULED appointments can be completed");
                });
    }

    // ── GET APPOINTMENTS SCOPING TESTS ────────────────────────────────────────

    @Test
    @DisplayName("Patient queries only their own appointments via findByPatientUserEmail")
    void getAllAppointments_AsPatient_ScopesByEmail() {
        Appointment appt = new Appointment();
        appt.setId(70L);
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setStatus(AppointmentStatus.SCHEDULED);

        Page<Appointment> page = new PageImpl<>(List.of(appt));
        when(appointmentRepo.findByPatientUserEmail(eq("patient.test@hospital.com"), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<AppointmentResponse> response = appointmentService.getAllAppointments(
                "patient.test@hospital.com", "ROLE_PATIENT", 0, 10, "appointmentDate", "asc");

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(70L);
        verify(appointmentRepo).findByPatientUserEmail(eq("patient.test@hospital.com"), any(Pageable.class));
        verify(appointmentRepo, never()).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("Admin queries all appointments via findAll")
    void getAllAppointments_AsAdmin_QueriesAll() {
        Appointment appt1 = new Appointment();
        appt1.setId(71L);
        appt1.setDoctor(sampleDoctor);
        appt1.setPatient(samplePatient);
        appt1.setStatus(AppointmentStatus.SCHEDULED);

        Page<Appointment> page = new PageImpl<>(List.of(appt1));
        when(appointmentRepo.findAll(any(Pageable.class))).thenReturn(page);

        PagedResponse<AppointmentResponse> response = appointmentService.getAllAppointments(
                "admin@hospital.com", "ROLE_ADMIN", 0, 10, "appointmentDate", "asc");

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(71L);
        verify(appointmentRepo).findAll(any(Pageable.class));
        verify(appointmentRepo, never()).findByPatientUserEmail(any(), any());
    }

    @Test
    @DisplayName("Patient viewing another patient's appointment by ID throws 403 Forbidden")
    void getAppointmentById_PatientAccessingOtherPatient_ThrowsForbidden() {
        Appointment appt = new Appointment();
        appt.setId(80L);
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient); // owner is patient.test@hospital.com

        when(appointmentRepo.findById(80L)).thenReturn(Optional.of(appt));

        assertThatThrownBy(() -> appointmentService.getAppointmentById(
                80L, "other@hospital.com", "ROLE_PATIENT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("You are not allowed to view this appointment");
                });
    }

    @Test
    @DisplayName("Non-existent appointment throws 404 ResourceNotFoundException")
    void getAppointmentById_NotFound_ThrowsException() {
        when(appointmentRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.getAppointmentById(
                999L, "admin@hospital.com", "ROLE_ADMIN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Appointment not found with id: 999");
    }
}
