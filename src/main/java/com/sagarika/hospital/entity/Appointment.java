package com.sagarika.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")


public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false)
    private LocalTime appointmentTime;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;


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
    public String getStatus(){
        return status;
    }
    public void setStatus(String status){
        this.status = status;
    }
}
