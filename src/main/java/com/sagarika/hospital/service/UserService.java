package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepo;

    private User getUserOrThrow(Long id){
        return userRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    //CRUD Methods

    //Create
    public User saveUser(User user){

        if(userRepo.findByEmail(user.getEmail()).isPresent()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        return userRepo.save(user);
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
    public User updateUser(Long id, User updatedUser){
        User existingUser = getUserOrThrow(id);

        //Update Fields
        existingUser.setName(updatedUser.getName());

        //Add Other Fields If Exist
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPassword(updatedUser.getPassword());
        existingUser.setRole(updatedUser.getRole());

        return userRepo.save(existingUser);
    }

    //Delete
    public void deleteUser(Long id){
        User user = getUserOrThrow(id);
        userRepo.delete(user);
    }
}