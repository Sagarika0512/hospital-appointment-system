package com.sagarika.hospital.controller;


import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {

    //Inject Service (Constructor Injection ONLY)
    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService){
        this.doctorService = doctorService;
    }


    //Add APIs

    //Create Doctor
    @PostMapping
    public Doctor createDoctor(@Valid @RequestBody Doctor doctor){
        return doctorService.saveDoctor(doctor);
    }

    //Get All
    @GetMapping
    public List<Doctor> getAllDoctors(){
        return doctorService.getAllDoctors();
    }

    //Get By ID
    @GetMapping("/{id}")
    public Doctor getDoctorById(@PathVariable Long id){
        return doctorService.getDoctorById(id);
    }

    //Update
    @PutMapping("/{id}")
    public Doctor updateDoctor(@PathVariable Long id, @Valid @RequestBody Doctor doctor){
        return doctorService.updateDoctor(id, doctor);
    }

    //Delete
    @DeleteMapping("/{id}")
    public void deleteDoctor(@PathVariable Long id){
        doctorService.deleteDoctor(id);
    }


    
}
