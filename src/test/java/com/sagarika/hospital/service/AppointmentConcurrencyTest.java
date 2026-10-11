package com.sagarika.hospital.service;

import com.sagarika.hospital.dto.AppointmentRequest;
import com.sagarika.hospital.dto.AppointmentResponse;
import com.sagarika.hospital.entity.Appointment;
import com.sagarika.hospital.entity.Doctor;
import com.sagarika.hospital.entity.Patient;
import com.sagarika.hospital.entity.User;
import com.sagarika.hospital.exception.AppointmentConflictException;
import com.sagarika.hospital.repository.AppointmentRepository;
import com.sagarika.hospital.repository.DoctorRepository;
import com.sagarika.hospital.repository.PatientRepository;
import com.sagarika.hospital.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppointmentConcurrencyTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final List<Long> createdAppointmentIds = new ArrayList<>();
    private final List<Long> createdPatientIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdDoctorIds = new ArrayList<>();

    private Doctor testDoctor;
    private String patient1Email;
    private String patient2Email;
    private LocalDate targetDate;
    private LocalTime targetTime;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Create dedicated test Doctor
        testDoctor = new Doctor();
        testDoctor.setName("Dr. Concurrency " + uniqueSuffix);
        testDoctor.setSpecialization("Neurology");
        testDoctor.setEmail("dr_conc_" + uniqueSuffix + "@hospital.com");
        testDoctor.setPhone("1234567890");
        testDoctor = doctorRepository.save(testDoctor);
        createdDoctorIds.add(testDoctor.getId());

        // 2. Create Patient 1
        patient1Email = "conc_p1_" + uniqueSuffix + "@hospital.com";
        User u1 = new User();
        u1.setName("Conc Patient 1");
        u1.setEmail(patient1Email);
        u1.setPassword(passwordEncoder.encode("Pass123!"));
        u1.setRole("PATIENT");
        u1 = userRepository.save(u1);
        createdUserIds.add(u1.getId());

        Patient p1 = new Patient();
        p1.setName("Conc Patient 1");
        p1.setEmail(patient1Email);
        p1.setUser(u1);
        p1 = patientRepository.save(p1);
        createdPatientIds.add(p1.getId());

        // 3. Create Patient 2
        patient2Email = "conc_p2_" + uniqueSuffix + "@hospital.com";
        User u2 = new User();
        u2.setName("Conc Patient 2");
        u2.setEmail(patient2Email);
        u2.setPassword(passwordEncoder.encode("Pass123!"));
        u2.setRole("PATIENT");
        u2 = userRepository.save(u2);
        createdUserIds.add(u2.getId());

        Patient p2 = new Patient();
        p2.setName("Conc Patient 2");
        p2.setEmail(patient2Email);
        p2.setUser(u2);
        p2 = patientRepository.save(p2);
        createdPatientIds.add(p2.getId());

        targetDate = LocalDate.now().plusDays(40);
        targetTime = LocalTime.of(16, 0);
    }

    @AfterEach
    void tearDown() {
        for (Long id : createdAppointmentIds) {
            appointmentRepository.findById(id).ifPresent(appointmentRepository::delete);
        }
        createdAppointmentIds.clear();

        for (Long id : createdPatientIds) {
            patientRepository.findById(id).ifPresent(patientRepository::delete);
        }
        createdPatientIds.clear();

        for (Long id : createdUserIds) {
            userRepository.findById(id).ifPresent(userRepository::delete);
        }
        createdUserIds.clear();

        for (Long id : createdDoctorIds) {
            doctorRepository.findById(id).ifPresent(doctorRepository::delete);
        }
        createdDoctorIds.clear();
    }

    @Test
    @DisplayName("Two concurrent booking attempts for identical doctor/date/time result in exactly 1 success, 1 rejection, and 1 persisted appointment")
    void concurrentBookingAttempts_SameSlot_OnlyOneSucceeds() throws Exception {
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        CountDownLatch startGun = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());
        List<AppointmentResponse> responses = Collections.synchronizedList(new ArrayList<>());

        // Thread 1: Patient 1 books the slot
        executor.submit(() -> {
            try {
                startGun.await();
                AppointmentRequest req1 = new AppointmentRequest();
                req1.setDoctorId(testDoctor.getId());
                req1.setAppointmentDate(targetDate);
                req1.setAppointmentTime(targetTime);
                req1.setReason("Concurrent Booking Thread 1");

                AppointmentResponse res = appointmentService.createAppointment(req1, patient1Email, "ROLE_PATIENT");
                responses.add(res);
                successCount.incrementAndGet();
            } catch (Throwable t) {
                exceptions.add(t);
                failureCount.incrementAndGet();
            } finally {
                finishLatch.countDown();
            }
        });

        // Thread 2: Patient 2 books the exact same slot
        executor.submit(() -> {
            try {
                startGun.await();
                AppointmentRequest req2 = new AppointmentRequest();
                req2.setDoctorId(testDoctor.getId());
                req2.setAppointmentDate(targetDate);
                req2.setAppointmentTime(targetTime);
                req2.setReason("Concurrent Booking Thread 2");

                AppointmentResponse res = appointmentService.createAppointment(req2, patient2Email, "ROLE_PATIENT");
                responses.add(res);
                successCount.incrementAndGet();
            } catch (Throwable t) {
                exceptions.add(t);
                failureCount.incrementAndGet();
            } finally {
                finishLatch.countDown();
            }
        });

        // Release both threads simultaneously
        startGun.countDown();

        boolean finishedInTime = finishLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finishedInTime).as("Concurrency test must complete within timeout").isTrue();

        // Track successfully created appointment for cleanup
        for (AppointmentResponse res : responses) {
            createdAppointmentIds.add(res.getId());
        }

        // INVARIANT 1: Exactly ONE booking succeeded
        assertThat(successCount.get())
                .as("Exactly one concurrent booking attempt must succeed")
                .isEqualTo(1);

        // INVARIANT 2: Exactly ONE booking failed
        assertThat(failureCount.get())
                .as("Exactly one concurrent booking attempt must be rejected")
                .isEqualTo(1);

        // INVARIANT 3: Failure was caused by AppointmentConflictException or DataIntegrityViolationException
        Throwable failedException = exceptions.get(0);
        boolean isExpectedConflict = (failedException instanceof AppointmentConflictException)
                || (failedException instanceof DataIntegrityViolationException)
                || (failedException.getCause() instanceof DataIntegrityViolationException);

        assertThat(isExpectedConflict)
                .as("Failed attempt must be rejected due to conflict or unique constraint violation, but got: " + failedException)
                .isTrue();

        // INVARIANT 4: Exactly ONE appointment is persisted in the database for the slot
        List<Appointment> persistedAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getDoctor().getId().equals(testDoctor.getId())
                        && a.getAppointmentDate().equals(targetDate)
                        && a.getAppointmentTime().equals(targetTime))
                .toList();

        assertThat(persistedAppointments)
                .as("Database must contain exactly one appointment for this slot")
                .hasSize(1);
    }
}
