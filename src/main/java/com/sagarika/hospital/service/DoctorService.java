package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepo;

    public DoctorService(DoctorRepository doctorRepo){
        this.doctorRepo = doctorRepo;
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
        return doctorRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    //Update
    public Doctor updateDoctor(Long id, Doctor updatedDoctor){
        Doctor existingDoctor = doctorRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));

        // Update fields
        existingDoctor.setName(updatedDoctor.getName());

        // add other fields if exist
        existingDoctor.setSpecialization(updatedDoctor.getSpecialization());
        existingDoctor.setEmail(updatedDoctor.getEmail());
        existingDoctor.setPhone(updatedDoctor.getPhone());

        return doctorRepo.save(existingDoctor);

    }

    //Delete
    public void deleteDoctor(Long id){
        Doctor doctor = doctorRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        doctorRepo.delete(doctor);
    }

}
