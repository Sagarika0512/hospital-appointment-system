package com.sagarika.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// Receives login data from the frontend (email + password only)
public class LoginRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    //Getters & Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
