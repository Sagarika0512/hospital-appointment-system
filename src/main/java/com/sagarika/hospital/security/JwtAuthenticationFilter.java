package com.sagarika.hospital.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

// This filter runs BEFORE every API request.
// It checks if the request has a valid JWT token in the "Authorization" header.
// If yes -> the request is treated as authenticated.
// If no -> the request continues without authentication (Spring Security will
//          then decide if the endpoint allows unauthenticated access).
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Get the Authorization header
        String authHeader = request.getHeader("Authorization");

        // 2. If no token is present, skip and let the request continue
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract the token (remove "Bearer " prefix)
        String token = authHeader.substring(7);

        // 4. Validate the token and set authentication
        if (jwtUtil.isTokenValid(token)) {
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            // Create an authentication object that Spring Security understands
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_" + role)
                            )
                    );
            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // Tell Spring Security: "this request is authenticated"
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // 5. Continue processing the request
        filterChain.doFilter(request, response);
    }
}
