package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepo;

    public DoctorService(DoctorRepository doctorRepo){
        this.doctorRepo = doctorRepo;
    }

    private Doctor getDoctorOrThrow(Long id){
        return doctorRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    //CRUD Methods

    //Create
    public Doctor saveDoctor(Doctor doctor){
        return doctorRepo.save(doctor);
    }

    //Read All
    public List<Doctor> getAllDoctors(){

        return doctorRepo.findAll();
    }

    //Read By ID
    public Doctor getDoctorById(Long id){
        return getDoctorOrThrow(id);
    }

    //Update
    public Doctor updateDoctor(Long id, Doctor updatedDoctor){
        Doctor existingDoctor = getDoctorOrThrow(id);

        // Update fields
        existingDoctor.setName(updatedDoctor.getName());
        existingDoctor.setSpecialization(updatedDoctor.getSpecialization());
        existingDoctor.setEmail(updatedDoctor.getEmail());
        existingDoctor.setPhone(updatedDoctor.getPhone());

        return doctorRepo.save(existingDoctor);

    }

    //Delete
    public void deleteDoctor(Long id){
        Doctor doctor = getDoctorOrThrow(id);
        doctorRepo.delete(doctor);
    }

}
