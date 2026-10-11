package com.sagarika.hospital.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI hospitalManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Hospital Management System API")
                        .description("REST API documentation for Hospital Appointment Management System. " +
                                "Supports authentication, role-based authorization (ADMIN / PATIENT), " +
                                "doctor and patient management, and concurrency-safe appointment scheduling.")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Hospital System Engineering Team")
                                .email("support@hospital.com"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token obtained from /api/auth/login")));
    }
}
