package com.sagarika.hospital.repository;
import com.sagarika.hospital.entity.Patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepo extends JpaRepository<Patient, Long> {
}
