package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.dto.PatientRequest;
import com.sagarika.hospital.dto.PatientResponse;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepo;

    @InjectMocks
    private PatientService patientService;

    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient();
        samplePatient.setId(1L);
        samplePatient.setName("John Smith");
        samplePatient.setEmail("john.smith@test.com");
        samplePatient.setPhone("9876543210");
        samplePatient.setDateOfBirth(LocalDate.of(1990, 1, 1));
    }

    @Test
    @DisplayName("savePatient creates and returns PatientResponse DTO")
    void savePatient_Success() {
        PatientRequest request = new PatientRequest("John Smith", "john.smith@test.com", "9876543210", LocalDate.of(1990, 1, 1));
        when(patientRepo.save(any(Patient.class))).thenReturn(samplePatient);

        PatientResponse response = patientService.savePatient(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("John Smith");
        assertThat(response.getEmail()).isEqualTo("john.smith@test.com");
        verify(patientRepo).save(any(Patient.class));
    }

    @Test
    @DisplayName("getAllPatients returns correctly mapped PagedResponse")
    void getAllPatients_ReturnsPagedResponse() {
        Page<Patient> page = new PageImpl<>(List.of(samplePatient));
        when(patientRepo.findAll(any(Pageable.class))).thenReturn(page);

        PagedResponse<PatientResponse> response = patientService.getAllPatients(0, 10, "id", "asc");

        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("John Smith");
        assertThat(response.getPageNo()).isEqualTo(0);
        assertThat(response.getTotalElements()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getPatientById throws 404 when patient does not exist")
    void getPatientById_NotFound_ThrowsNotFound() {
        when(patientRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.getPatientById(999L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    @DisplayName("deletePatient deletes existing patient")
    void deletePatient_Success() {
        when(patientRepo.findById(1L)).thenReturn(Optional.of(samplePatient));

        patientService.deletePatient(1L);

        verify(patientRepo).delete(samplePatient);
    }
}
