package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.AppointmentStatus;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.exception.AppointmentConflictException;
import com.sagarika.hospital.exception.ResourceNotFoundException;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.dto.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepo;
    private final PatientRepository patientRepo;
    private final DoctorRepository doctorRepo;

    public AppointmentService(
            AppointmentRepository appointmentRepo,
            PatientRepository patientRepo,
            DoctorRepository doctorRepo
    ){
        this.appointmentRepo = appointmentRepo;
        this.patientRepo = patientRepo;
        this.doctorRepo = doctorRepo;
    }

    private Appointment getAppointmentOrThrow(Long id){
        return appointmentRepo.findById(id).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Appointment not found with id: " + id
                )
        );
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    // - PATIENT: patient is always resolved from their authenticated email.
    //            Any patientId in the request is ignored.
    // - ADMIN:   patientId must be provided in the request body.
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request,
                                                 String authenticatedEmail,
                                                 String role) {
        // Past-date validation
        if (request.getAppointmentDate() != null && request.getAppointmentTime() != null) {
            LocalDateTime appointmentDateTime = LocalDateTime.of(
                    request.getAppointmentDate(), request.getAppointmentTime());
            if (appointmentDateTime.isBefore(LocalDateTime.now())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cannot book an appointment in the past");
            }
        }

        // Resolve patient based on role
        Patient patient;
        if ("ROLE_ADMIN".equals(role)) {
            // ADMIN must supply a patientId
            if (request.getPatientId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "ADMIN must provide a patientId");
            }
            patient = patientRepo.findById(request.getPatientId()).orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Patient not found with id: " + request.getPatientId()));
        } else {
            // PATIENT: always use the patient linked to the authenticated user
            patient = patientRepo.findByUserEmail(authenticatedEmail).orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "No patient profile is linked to your account"));
        }

        // Fetch doctor
        Doctor doctor = doctorRepo.findById(request.getDoctorId()).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Doctor not found with id: " + request.getDoctorId()));

        // Double-booking check
        boolean alreadyBooked = appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime()
        );
        if (alreadyBooked) {
            throw new AppointmentConflictException(
                    "Doctor is already booked for this time slot");
        }

        // Build and save
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        try {
            Appointment saved = appointmentRepo.save(appointment);
            return mapToResponse(saved);
        } catch (DataIntegrityViolationException e) {
            throw new AppointmentConflictException("Doctor is already booked for this time slot");
        }
    }

    // ── READ ALL (PAGINATED) ───────────────────────────────────────────────────
    // - ADMIN: returns all appointments.
    // - PATIENT: returns only appointments belonging to their linked patient.
    public PagedResponse<AppointmentResponse> getAllAppointments(
            String authenticatedEmail,
            String role,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        int validatedSize = Math.min(Math.max(size, 1), 50);
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(page, 0), validatedSize, sort);

        Page<Appointment> appointmentPage;
        if ("ROLE_ADMIN".equals(role)) {
            appointmentPage = appointmentRepo.findAll(pageable);
        } else {
            appointmentPage = appointmentRepo.findByPatientUserEmail(authenticatedEmail, pageable);
        }

        List<AppointmentResponse> content = appointmentPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                content,
                appointmentPage.getNumber(),
                appointmentPage.getSize(),
                appointmentPage.getTotalElements(),
                appointmentPage.getTotalPages(),
                appointmentPage.isLast()
        );
    }

    // ── READ BY ID ────────────────────────────────────────────────────────────
    // - ADMIN: can view any appointment.
    // - PATIENT: can only view their own appointment.
    public AppointmentResponse getAppointmentById(Long id,
                                                  String authenticatedEmail,
                                                  String role) {
        Appointment appointment = getAppointmentOrThrow(id);
        if (!"ROLE_ADMIN".equals(role)) {
            String ownerEmail = appointment.getPatient().getUser() != null
                    ? appointment.getPatient().getUser().getEmail()
                    : null;
            if (!authenticatedEmail.equals(ownerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not allowed to view this appointment");
            }
        }
        return mapToResponse(appointment);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment existing = getAppointmentOrThrow(id);

        // Past-date validation
        if (request.getAppointmentDate() != null && request.getAppointmentTime() != null) {
            LocalDateTime appointmentDateTime = LocalDateTime.of(
                    request.getAppointmentDate(), request.getAppointmentTime());
            if (appointmentDateTime.isBefore(LocalDateTime.now())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cannot book an appointment in the past");
            }
        }

        // Double-booking check (excluding current appointment)
        boolean alreadyBooked = appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNot(
                existing.getDoctor().getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                existing.getId()
        );
        if (alreadyBooked) {
            throw new AppointmentConflictException(
                    "Doctor is already booked for this time slot");
        }

        existing.setAppointmentDate(request.getAppointmentDate());
        existing.setAppointmentTime(request.getAppointmentTime());
        existing.setReason(request.getReason());

        try {
            Appointment saved = appointmentRepo.save(existing);
            return mapToResponse(saved);
        } catch (DataIntegrityViolationException e) {
            throw new AppointmentConflictException("Doctor is already booked for this time slot");
        }
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────
    // Only SCHEDULED appointments may be cancelled.
    // PATIENT can only cancel their own appointment.
    // ADMIN can cancel any appointment.
    @Transactional
    public AppointmentResponse cancelAppointment(Long id,
                                                 String authenticatedEmail,
                                                 String role) {
        Appointment existing = getAppointmentOrThrow(id);

        // Authorization: PATIENT can only cancel their own
        if (!"ROLE_ADMIN".equals(role)) {
            String ownerEmail = existing.getPatient().getUser() != null
                    ? existing.getPatient().getUser().getEmail()
                    : null;
            if (!authenticatedEmail.equals(ownerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not allowed to cancel this appointment");
            }
        }

        // Status transition: only SCHEDULED → CANCELLED
        if (existing.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only SCHEDULED appointments can be cancelled. Current status: "
                            + existing.getStatus());
        }

        existing.setStatus(AppointmentStatus.CANCELLED);
        return mapToResponse(appointmentRepo.save(existing));
    }

    // ── COMPLETE ──────────────────────────────────────────────────────────────
    // Only ADMIN can mark an appointment as complete.
    // Only SCHEDULED appointments may be completed.
    @Transactional
    public AppointmentResponse completeAppointment(Long id) {
        Appointment existing = getAppointmentOrThrow(id);

        // Status transition: only SCHEDULED → COMPLETED
        if (existing.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only SCHEDULED appointments can be completed. Current status: "
                            + existing.getStatus());
        }

        existing.setStatus(AppointmentStatus.COMPLETED);
        return mapToResponse(appointmentRepo.save(existing));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    @Transactional
    public void deleteAppointment(Long id) {
        Appointment existing = getAppointmentOrThrow(id);
        appointmentRepo.delete(existing);
    }

    // ── MAPPING HELPER ────────────────────────────────────────────────────────
    private AppointmentResponse mapToResponse(Appointment appointment) {
        AppointmentResponse res = new AppointmentResponse();

        res.setId(appointment.getId());
        res.setAppointmentDate(appointment.getAppointmentDate());
        res.setAppointmentTime(appointment.getAppointmentTime());
        res.setReason(appointment.getReason());
        res.setStatus(appointment.getStatus().name());

        res.setDoctorName(appointment.getDoctor().getName());
        res.setPatientName(appointment.getPatient().getName());

        return res;
    }
}
