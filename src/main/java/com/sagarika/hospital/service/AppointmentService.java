package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
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
        return appointmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found with id: "+id));
    }

    //Create
    public Appointment createAppointment(Long patientId, Long doctorId, Appointment appointment){
        Patient patient = patientRepo.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found with id: " + patientId));
        Doctor doctor = doctorRepo.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        return appointmentRepo.save(appointment);

    }

    //Read
    public List<Appointment> getAllAppointments(){
        return appointmentRepo.findAll();
    }

    //Read By ID
    public Appointment getAppointmentById(Long id){
        return getAppointmentOrThrow(id);
    }

    //Update
    public Appointment updateAppointment(Long id, Appointment updatedAppointment){
        Appointment existing = getAppointmentOrThrow(id);

        existing.setAppointmentDate(updatedAppointment.getAppointmentDate());
        existing.setAppointmentTime(updatedAppointment.getAppointmentTime());

        return appointmentRepo.save(existing);
    }

    //Delete
    public void deleteAppointment(Long id){
        Appointment existing = getAppointmentOrThrow(id);
        appointmentRepo.delete(existing);
    }

}
