package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.AppointmentStatus;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.stereotype.Service;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.exception.AppointmentConflictException;
import com.sagarika.hospital.exception.ResourceNotFoundException;
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
        return appointmentRepo.findById(id).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Appointment not found with id: "+id
                )
        );
    }

    //Create
    public AppointmentResponse createAppointment(AppointmentRequest request){

        // 1. Fetch doctor & patient
        Doctor doctor = doctorRepo.findById(request.getDoctorId()).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Doctor not found with id: " + request.getDoctorId()
                )
        );
        Patient patient = patientRepo.findById(request.getPatientId()).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Patient not found with id: " + request.getPatientId()
                )
        );

        //Adding Double Booking Check OR Check Booking Conflict
        boolean alreadyBooked = appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime()

        );
        if(alreadyBooked){
            throw new AppointmentConflictException(
                    "Doctor is already booked for this time slot");
        }


        // 2. Create appointment entity
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.SCHEDULED);



        // 3. Save
        Appointment saved = appointmentRepo.save(appointment);

        // 4. Convert to response DTO
        return mapToResponse(saved);

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
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request){
        Appointment existing = getAppointmentOrThrow(id);

        //Adding Double Booking Check OR Check Booking Conflict
        boolean alreadyBooked = appointmentRepo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNot(
                existing.getDoctor().getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                existing.getId()
        );
        if(alreadyBooked){
            throw new AppointmentConflictException(
                    "Doctor is already booked for this time slot"
            );
        }

        existing.setAppointmentDate(request.getAppointmentDate());
        existing.setAppointmentTime(request.getAppointmentTime());
        existing.setReason(request.getReason());


        Appointment saved = appointmentRepo.save(existing);
        return mapToResponse(saved);
    }

    //Delete
    public void deleteAppointment(Long id){
        Appointment existing = getAppointmentOrThrow(id);
        appointmentRepo.delete(existing);
    }


    //Mapping Helper
    //Bcz ALL helper methods ≠ only mapping
    private AppointmentResponse mapToResponse(Appointment appointment){
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
