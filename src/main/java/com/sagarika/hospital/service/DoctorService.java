package com.sagarika.hospital.service;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
import org.springframework.stereotype.Service;

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
        return doctorRepo.findById(id).orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    //Delete
    public void deleteDoctor(Long id){
        doctorRepo.deleteById(id);
    }

}
