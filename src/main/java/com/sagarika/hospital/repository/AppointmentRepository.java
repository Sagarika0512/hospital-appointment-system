package com.sagarika.hospital.repository;

import com.sagarika.hospital.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // For Create in AppointmentService
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTime(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime
    );

    // For Update in AppointmentService
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Long id
    );

    // For PATIENT-scoped appointment listing — only returns appointments
    // belonging to the patient linked to the given user email.
    List<Appointment> findByPatientUserEmail(String email);

    // Paginated PATIENT-scoped appointment listing
    Page<Appointment> findByPatientUserEmail(String email, Pageable pageable);
}
