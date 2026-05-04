package com.sagarika.hospital.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;


@JsonPropertyOrder({
        "id",
        "appointmentDate",
        "appointmentTime",
        "reason",
        "status",
        "doctorName",
        "patientName"

})

public class AppointmentResponse {

    private Long id;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String reason;
    private String status;

    private String doctorName;
    private String patientName;

    //getters & setters

    public Long getId(){
        return id;
    }
    public void setId(Long id){
        this.id = id;
    }

    public LocalDate getAppointmentDate(){
        return appointmentDate;
    }
    public void setAppointmentDate(LocalDate appointmentDate){
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime(){
        return appointmentTime;
    }
    public void setAppointmentTime(LocalTime appointmentTime){
        this.appointmentTime = appointmentTime;
    }

    public String getReason(){
        return reason;
    }
    public void setReason(String reason){
        this.reason = reason;
    }

    public String getStatus(){
        return status;
    }
    public void setStatus(String status){
        this.status = status;
    }

    public String getDoctorName(){
        return doctorName;
    }
    public void setDoctorName(String doctorName){
        this.doctorName = doctorName;
    }

    public String getPatientName(){
        return patientName;
    }
    public void setPatientName(String patientName){
        this.patientName = patientName;
    }















}
