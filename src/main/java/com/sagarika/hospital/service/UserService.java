package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepo;
    private final PatientRepository patientRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, PatientRepository patientRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.patientRepo = patientRepo;
        this.passwordEncoder = passwordEncoder;
    }

    private User getUserOrThrow(Long id){
        return userRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    //CRUD Methods

    //Create — now hashes the password before saving and creates linked Patient record
    @Transactional
    public User saveUser(User user){

        if(userRepo.findByEmail(user.getEmail()).isPresent()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        // Hash the password so it's not stored as plain text
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepo.save(user);

        // Automatically create associated Patient record for PATIENT role
        if (savedUser.getRole() == null || "PATIENT".equalsIgnoreCase(savedUser.getRole())) {
            Patient patient = patientRepo.findByEmail(savedUser.getEmail()).orElseGet(Patient::new);
            patient.setName(savedUser.getName());
            patient.setEmail(savedUser.getEmail());
            patient.setUser(savedUser);
            patientRepo.save(patient);
        }

        return savedUser;
    }

    //Read All
    public List<User> getAllUsers(){
        return userRepo.findAll();
    }

    //Read By ID
    public User getUserById(Long id){
        return getUserOrThrow(id);
    }

    //Login authentication depends on email lookup
    public Optional<User> getUserByEmail(String email){
        return userRepo.findByEmail(email);
    }

    //Update
    @Transactional
    public User updateUser(Long id, User updatedUser){
        User existingUser = getUserOrThrow(id);

        //Update Fields
        existingUser.setName(updatedUser.getName());

        //Add Other Fields If Exist
        existingUser.setEmail(updatedUser.getEmail());
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }
        existingUser.setRole(updatedUser.getRole());

        User savedUser = userRepo.save(existingUser);

        // Keep linked patient email/name in sync if present
        patientRepo.findByUserId(savedUser.getId()).ifPresent(patient -> {
            patient.setName(savedUser.getName());
            patient.setEmail(savedUser.getEmail());
            patientRepo.save(patient);
        });

        return savedUser;
    }

    //Delete
    @Transactional
    public void deleteUser(Long id){
        User user = getUserOrThrow(id);
        userRepo.delete(user);
    }
}