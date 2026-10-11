package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.DoctorRequest;
import com.sagarika.hospital.dto.DoctorResponse;
import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepo;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor sampleDoctor;

    @BeforeEach
    void setUp() {
        sampleDoctor = new Doctor();
        sampleDoctor.setId(1L);
        sampleDoctor.setName("Dr. Sarah Connor");
        sampleDoctor.setSpecialization("Neurology");
        sampleDoctor.setEmail("sarah@hospital.com");
        sampleDoctor.setPhone("1234567890");
    }

    @Test
    @DisplayName("saveDoctor creates and returns DoctorResponse DTO")
    void saveDoctor_Success() {
        DoctorRequest request = new DoctorRequest("Dr. Sarah Connor", "Neurology", "sarah@hospital.com", "1234567890");
        when(doctorRepo.save(any(Doctor.class))).thenReturn(sampleDoctor);

        DoctorResponse response = doctorService.saveDoctor(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Dr. Sarah Connor");
        assertThat(response.getSpecialization()).isEqualTo("Neurology");
        verify(doctorRepo).save(any(Doctor.class));
    }

    @Test
    @DisplayName("getAllDoctors returns correctly mapped PagedResponse")
    void getAllDoctors_ReturnsPagedResponse() {
        Page<Doctor> page = new PageImpl<>(List.of(sampleDoctor));
        when(doctorRepo.findAll(any(Pageable.class))).thenReturn(page);

        PagedResponse<DoctorResponse> response = doctorService.getAllDoctors(0, 10, "id", "asc");

        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Dr. Sarah Connor");
        assertThat(response.getPageNo()).isEqualTo(0);
        assertThat(response.getTotalElements()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getDoctorById throws 404 when doctor does not exist")
    void getDoctorById_NotFound_ThrowsNotFound() {
        when(doctorRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.getDoctorById(999L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    @DisplayName("deleteDoctor deletes existing doctor")
    void deleteDoctor_Success() {
        when(doctorRepo.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        doctorService.deleteDoctor(1L);

        verify(doctorRepo).delete(sampleDoctor);
    }
}
