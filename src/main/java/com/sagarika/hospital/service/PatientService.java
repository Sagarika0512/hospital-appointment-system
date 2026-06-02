package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepo;

    private Patient getPatientOrThrow(Long id){
        return patientRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

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
        return getPatientOrThrow(id);
    }

    //Update
    public Patient updatePatient(Long id, Patient updatedPatient){
        Patient existingPatient = getPatientOrThrow(id);

        // Update fields
        existingPatient.setName(updatedPatient.getName());

        // add other fields if exist
        existingPatient.setName(updatedPatient.getName());
        existingPatient.setEmail(updatedPatient.getEmail());
        existingPatient.setPhone(updatedPatient.getPhone());
        existingPatient.setDateOfBirth(updatedPatient.getDateOfBirth());

        return patientRepo.save(existingPatient);

    }

    //Delete
    public void deletePatient(Long id){

        Patient patient = getPatientOrThrow(id);
        patientRepo.delete(patient);
    }



}
