package com.sagarika.hospital.controller;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.service.AppointmentService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {

    //Inject Service
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService){
        this.appointmentService = appointmentService;
    }

    //Creating API
    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid
            @RequestBody AppointmentRequest request){

        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest request){
        return ResponseEntity.ok(appointmentService.updateAppointment(id, request));
    }

    //Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id){
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
