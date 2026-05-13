package com.sagarika.hospital.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "appointments")


public class Appointment{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private LocalDate appointmentDate;

    @NotNull
    @Column(nullable = false)
    private LocalTime appointmentTime;

    // @NotNull -> only prevents null
    // @NotBlank -> prevents null + empty + spaces
    @NotBlank
    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnore
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnore
    private Doctor doctor;


    //Getter & Setter of Patient
    public Long getId(){
        return id;
    }
    public void setId(Long id){
        this.id = id;
    }


    //Getter & Setter of Patient
    public Patient getPatient(){
        return patient;
    }
    public void setPatient(Patient patient){
        this.patient = patient;
    }


    //Getter & Setter of Doctor
    public Doctor getDoctor(){
        return doctor;
    }
    public void setDoctor(Doctor doctor){
        this.doctor = doctor;
    }



    //Getter & Setter of Date
    public LocalDate getAppointmentDate(){
        return appointmentDate;
    }
    public void setAppointmentDate(LocalDate appointmentDate){
        this.appointmentDate = appointmentDate;
    }

    //Getter & Setter of Time
    public LocalTime getAppointmentTime(){
        return appointmentTime;
    }
    public void setAppointmentTime(LocalTime appointmentTime){
        this.appointmentTime = appointmentTime;
    }



    //Getter & Setter of Reason
    public String getReason(){
        return reason;
    }
    public void setReason(String reason){
        this.reason = reason;
    }

    //Getter & Setter of Status
    public AppointmentStatus getStatus(){
        return status;
    }
    public void setStatus(AppointmentStatus status){
        this.status = status;
    }
}
