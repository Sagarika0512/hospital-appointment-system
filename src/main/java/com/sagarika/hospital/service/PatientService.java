package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.PagedResponse;
import com.sagarika.hospital.dto.PatientRequest;
import com.sagarika.hospital.dto.PatientResponse;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepo;

    public PatientService(PatientRepository patientRepo) {
        this.patientRepo = patientRepo;
    }

    private Patient getPatientOrThrow(Long id) {
        return patientRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    // Create
    public PatientResponse savePatient(PatientRequest request) {
        Patient patient = new Patient();
        patient.setName(request.getName());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setDateOfBirth(request.getDateOfBirth());
        Patient saved = patientRepo.save(patient);
        return mapToResponse(saved);
    }

    // Read All (Paginated)
    public PagedResponse<PatientResponse> getAllPatients(int page, int size, String sortBy, String sortDir) {
        int validatedSize = Math.min(Math.max(size, 1), 50);
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(page, 0), validatedSize, sort);
        Page<Patient> patientPage = patientRepo.findAll(pageable);
        List<PatientResponse> content = patientPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();
        return new PagedResponse<>(
                content,
                patientPage.getNumber(),
                patientPage.getSize(),
                patientPage.getTotalElements(),
                patientPage.getTotalPages(),
                patientPage.isLast()
        );
    }

    // Read By ID
    public PatientResponse getPatientById(Long id) {
        return mapToResponse(getPatientOrThrow(id));
    }

    // Update
    public PatientResponse updatePatient(Long id, PatientRequest updatedPatient) {
        Patient existingPatient = getPatientOrThrow(id);

        existingPatient.setName(updatedPatient.getName());
        existingPatient.setEmail(updatedPatient.getEmail());
        existingPatient.setPhone(updatedPatient.getPhone());
        existingPatient.setDateOfBirth(updatedPatient.getDateOfBirth());

        return mapToResponse(patientRepo.save(existingPatient));
    }

    // Delete
    public void deletePatient(Long id) {
        Patient patient = getPatientOrThrow(id);
        patientRepo.delete(patient);
    }

    private PatientResponse mapToResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getName(),
                patient.getEmail(),
                patient.getPhone(),
                patient.getDateOfBirth()
        );
    }
}
