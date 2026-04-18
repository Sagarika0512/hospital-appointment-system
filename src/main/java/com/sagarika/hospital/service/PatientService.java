package com.sagarika.hospital.service;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepo;

    public PatientService(PatientRepository patientRepo){
        this.patientRepo = patientRepo;
    }

    //CRUD Methods

    //Create
    public Patient savePatient(Patient patient){
        return patientRepo.save(patient);
    }

    //Read All
    public List<Patient> getAllPatients(){

        return patientRepo.findAll();
    }

    //Read By ID
    public Patient getPatientById(Long id){
        return patientRepo.findById(id).orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    //Delete
    public void deletePatient(Long id){
        patientRepo.deleteById(id);
    }



}
