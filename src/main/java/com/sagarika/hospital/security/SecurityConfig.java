package com.sagarika.hospital.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

// Main security configuration for the entire application.
// This controls:
// - Which endpoints are public vs protected
// - How CORS (Cross-Origin Resource Sharing) works
// - Password encoding method
// - Session management (stateless, because we use JWT tokens)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Allow frontend to call backend from a different port
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF because we use JWT tokens (not cookies) for authentication
            .csrf(csrf -> csrf.disable())

            // Don't create sessions — every request is authenticated by its JWT token
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Define which endpoints need authentication
            .authorizeHttpRequests(auth -> auth

                // PUBLIC: Actuator operational health endpoint
                .requestMatchers("/actuator/health").permitAll()

                // PUBLIC: OpenAPI / Swagger documentation
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // PUBLIC: Anyone can register or login
                .requestMatchers("/api/auth/**").permitAll()

                // PUBLIC: Anyone can view the list of doctors
                .requestMatchers(HttpMethod.GET, "/api/doctors", "/api/doctors/**").permitAll()

                // ADMIN ONLY: Creating, updating, or deleting doctors
                .requestMatchers(HttpMethod.POST, "/api/doctors").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/doctors/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/doctors/**").hasRole("ADMIN")

                // ADMIN ONLY: Viewing all patients, deleting patients
                .requestMatchers(HttpMethod.GET, "/api/patients").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/patients/**").hasRole("ADMIN")

                // APPOINTMENT RULES:
                // ADMIN ONLY: full update, delete, and marking complete
                .requestMatchers(HttpMethod.PUT, "/api/appointments/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/appointments/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/appointments/*/complete").hasRole("ADMIN")
                // PATIENT or ADMIN: book and cancel (service enforces ownership for PATIENT)
                .requestMatchers(HttpMethod.POST, "/api/appointments").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/appointments/*/cancel").authenticated()
                // PATIENT or ADMIN: read appointments (service scopes results by role)
                .requestMatchers(HttpMethod.GET, "/api/appointments", "/api/appointments/**").authenticated()

                // EVERYTHING ELSE: Must be logged in
                .anyRequest().authenticated()
            )

            // Add our JWT filter before Spring Security's default authentication filter
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    // CORS configuration: allows the React frontend (localhost:5173) to call the backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // BCrypt password encoder: scrambles passwords so they can't be read
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Required by Spring Security for authentication management
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
