package com.sagarika.hospital.controller;

import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.service.AppointmentService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    //Inject Service
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService){
        this.appointmentService = appointmentService;
        System.out.println("AppointmentController Loaded");
    }

    //Creating API
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestParam Long patientId, @RequestParam Long doctorId, @Valid @RequestBody Appointment appointment){
        Appointment saved = appointmentService.createAppointment(patientId, doctorId, appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    //Get All
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(){
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    //Get By ID
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long id){
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    //Update
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointment){
        return ResponseEntity.ok(appointmentService.updateAppointment(id, appointment));
    }

    //Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id){
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
