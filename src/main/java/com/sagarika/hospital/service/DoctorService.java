package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.DoctorRequest;
import com.sagarika.hospital.dto.DoctorResponse;
import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepo;

    public DoctorService(DoctorRepository doctorRepo) {
        this.doctorRepo = doctorRepo;
    }

    private Doctor getDoctorOrThrow(Long id) {
        return doctorRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    // Create
    public DoctorResponse saveDoctor(DoctorRequest request) {
        Doctor doctor = new Doctor();
        doctor.setName(request.getName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        Doctor saved = doctorRepo.save(doctor);
        return mapToResponse(saved);
    }

    // Read All (Paginated)
    public PagedResponse<DoctorResponse> getAllDoctors(int page, int size, String sortBy, String sortDir) {
        int validatedSize = Math.min(Math.max(size, 1), 50);
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(page, 0), validatedSize, sort);
        Page<Doctor> doctorPage = doctorRepo.findAll(pageable);
        List<DoctorResponse> content = doctorPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();
        return new PagedResponse<>(
                content,
                doctorPage.getNumber(),
                doctorPage.getSize(),
                doctorPage.getTotalElements(),
                doctorPage.getTotalPages(),
                doctorPage.isLast()
        );
    }

    // Read By ID
    public DoctorResponse getDoctorById(Long id) {
        return mapToResponse(getDoctorOrThrow(id));
    }

    // Update
    public DoctorResponse updateDoctor(Long id, DoctorRequest updatedDoctor) {
        Doctor existingDoctor = getDoctorOrThrow(id);

        existingDoctor.setName(updatedDoctor.getName());
        existingDoctor.setSpecialization(updatedDoctor.getSpecialization());
        existingDoctor.setEmail(updatedDoctor.getEmail());
        existingDoctor.setPhone(updatedDoctor.getPhone());

        return mapToResponse(doctorRepo.save(existingDoctor));
    }

    // Delete
    public void deleteDoctor(Long id) {
        Doctor doctor = getDoctorOrThrow(id);
        doctorRepo.delete(doctor);
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getName(),
                doctor.getSpecialization(),
                doctor.getEmail(),
                doctor.getPhone()
        );
    }
}
