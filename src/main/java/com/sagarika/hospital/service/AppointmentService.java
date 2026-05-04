package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.sagarika.hospital.dto.AppointmentResponse;

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
        return appointmentRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found with id: "+id));
    }

    //Create
    public Appointment createAppointment(Long patientId, Long doctorId, Appointment appointment){

        Patient patient = patientRepo.findById(patientId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found with id: " + patientId));
        Doctor doctor = doctorRepo.findById(doctorId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Doctor not found with id: " + doctorId));

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStatus("SCHEDULED");

        return appointmentRepo.save(appointment);

    }

    //Read
    public List<AppointmentResponse> getAllAppointments(){
        return appointmentRepo.findAll().stream().map(this::mapToResponse).toList();
    }

    //Read By ID
    public AppointmentResponse getAppointmentById(Long id) {
        return mapToResponse(getAppointmentOrThrow(id));
    }

    //Update
    public Appointment updateAppointment(Long id, Appointment updatedAppointment){
        Appointment existing = getAppointmentOrThrow(id);

        existing.setAppointmentDate(updatedAppointment.getAppointmentDate());
        existing.setAppointmentTime(updatedAppointment.getAppointmentTime());
        existing.setReason(updatedAppointment.getReason());

        if (updatedAppointment.getStatus() != null) {
            String status = updatedAppointment.getStatus();

            if (!status.equals("SCHEDULED") && !status.equals("COMPLETED") && !status.equals("CANCELLED")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
            }

            existing.setStatus(status);
        }

        return appointmentRepo.save(existing);
    }

    //Delete
    public void deleteAppointment(Long id){
        Appointment existing = getAppointmentOrThrow(id);
        appointmentRepo.delete(existing);
    }



    //Helper Method
    private AppointmentResponse mapToResponse(Appointment appointment){
        AppointmentResponse res = new AppointmentResponse();

        res.setId(appointment.getId());
        res.setAppointmentDate(appointment.getAppointmentDate());
        res.setAppointmentTime(appointment.getAppointmentTime());
        res.setReason(appointment.getReason());
        res.setStatus(appointment.getStatus());

        res.setDoctorName(appointment.getDoctor().getName());
        res.setPatientName(appointment.getPatient().getName());

        return res;
    }






}
