package com.sagarika.hospital.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "doctors")

public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String specialization;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;


}
