package com.sagarika.hospital.service;

import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private PatientRepository patientRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setName("Alice Walker");
        sampleUser.setEmail("alice@test.com");
        sampleUser.setPassword("rawPassword123");
        sampleUser.setRole("PATIENT");
    }

    @Test
    @DisplayName("Saving new user hashes password and auto-creates linked Patient record")
    void saveUser_AsPatient_Success_CreatesLinkedPatient() {
        when(userRepo.findByEmail("alice@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("rawPassword123")).thenReturn("hashedPasswordXYZ");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setName("Alice Walker");
        savedUser.setEmail("alice@test.com");
        savedUser.setPassword("hashedPasswordXYZ");
        savedUser.setRole("PATIENT");

        when(userRepo.save(any(User.class))).thenReturn(savedUser);
        when(patientRepo.findByEmail("alice@test.com")).thenReturn(Optional.empty());

        User result = userService.saveUser(sampleUser);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(passwordEncoder).encode("rawPassword123");

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(patientRepo).save(patientCaptor.capture());
        Patient capturedPatient = patientCaptor.getValue();
        assertThat(capturedPatient.getName()).isEqualTo("Alice Walker");
        assertThat(capturedPatient.getEmail()).isEqualTo("alice@test.com");
        assertThat(capturedPatient.getUser()).isEqualTo(savedUser);
    }

    @Test
    @DisplayName("Saving user with already existing email throws 400 Bad Request")
    void saveUser_DuplicateEmail_ThrowsBadRequest() {
        when(userRepo.findByEmail("alice@test.com")).thenReturn(Optional.of(new User()));

        assertThatThrownBy(() -> userService.saveUser(sampleUser))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Email already exists");
                });

        verify(userRepo, never()).save(any());
        verifyNoInteractions(patientRepo);
    }

    @Test
    @DisplayName("getUserById throws 404 when user is not found")
    void getUserById_NotFound_ThrowsNotFound() {
        when(userRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }
}
