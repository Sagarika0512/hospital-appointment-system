package com.sagarika.hospital.controller;


import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    //Inject Service (Constructor Injection ONLY)
    private final PatientService patientService;

    public PatientController(PatientService patientService){
        this.patientService = patientService;
    }


    //Add APIs

    //Create Patient
    @PostMapping
    public Patient createPatient(@RequestBody Patient patient){
        return patientService.savePatient(patient);
    }

    //Get All
    @GetMapping
    public List<Patient> getAllPatients(){
        return patientService.getAllPatients();
    }

    //Get By ID
    @GetMapping("/{id}")
    public Patient getPatientById(@PathVariable Long id){
        return patientService.getPatientById(id);
    }

    //Delete
    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable Long id){
        patientService.deletePatient(id);
    }







}
