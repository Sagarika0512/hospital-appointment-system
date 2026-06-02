package com.sagarika.hospital.controller;

import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@Valid @RequestBody User user) {
        return userService.saveUser(user);
    }

    @PostMapping("/login")
    public User login(@RequestBody User loginRequest){

        User user = userService.getUserByEmail(loginRequest.getEmail()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if(!user.getPassword().equals(loginRequest.getPassword())){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Password");
        }
        return user;
    }
}
