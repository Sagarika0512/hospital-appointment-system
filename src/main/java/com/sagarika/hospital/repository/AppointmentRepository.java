package com.sagarika.hospital.repository;
import com.sagarika.hospital.entity.Appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;


@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    //For Create in AppointmentService
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTime(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime
    );

    //For Update in AppointmentService
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Long id
    );
}
