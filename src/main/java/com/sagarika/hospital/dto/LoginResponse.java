package com.sagarika.hospital.dto;

// Sends login response to the frontend (token + user info, but NEVER the password)
public class LoginResponse {

    private String token;
    private String name;
    private String email;
    private String role;
    // Null for ADMIN users; populated for PATIENT users so the frontend knows
    // which patient record belongs to the authenticated user.
    private Long patientId;

    public LoginResponse(String token, String name, String email, String role) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    //Getters & Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }
}
