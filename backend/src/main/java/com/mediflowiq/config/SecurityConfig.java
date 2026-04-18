package com.mediflowiq.config;

import com.mediflowiq.security.JwtAuthFilter;
import com.mediflowiq.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

import java.util.List;

/**
 * Phase 4 — Spring Security configuration.
 *
 * Role matrix:
 *  ADMIN  → full access (manage users, view audit logs, all queue ops)
 *  DOCTOR → read queue, update patient status
 *  STAFF  → register patients, read queue
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired private UserDetailsServiceImpl userDetailsService;
    @Autowired private JwtAuthFilter jwtAuthFilter;

    // ── CORS (registered in Spring Security, handles preflight correctly) ──

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ── Password Encoder ──────────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── Authentication Provider ───────────────────────────────────────────

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ── Authentication Manager ────────────────────────────────────────────

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    // ── Security Filter Chain ─────────────────────────────────────────────

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS must be configured here for Spring Security to handle OPTIONS preflight
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF — we use stateless JWT
            .csrf(csrf -> csrf.disable())

            // Stateless session — no HTTP session
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Route-level authorisation rules
            .authorizeHttpRequests(auth -> auth

                // ── Public endpoints ─────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()          // WebSocket handshake
                .requestMatchers("/h2-console/**").permitAll()  // Dev only

                // ── Phase 5: Driver GPS (no JWT — mobile driver portal) ──
                .requestMatchers(HttpMethod.POST, "/api/ambulances/*/location").permitAll()

                // ── Queue API ────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/queue/**").hasAnyRole("ADMIN", "DOCTOR", "STAFF")
                .requestMatchers(HttpMethod.POST, "/api/queue/register").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PATCH, "/api/queue/*/status").hasAnyRole("ADMIN", "DOCTOR")

                // ── Ambulance API ─────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/ambulances/**").hasAnyRole("ADMIN", "DOCTOR", "STAFF")
                .requestMatchers(HttpMethod.PATCH, "/api/ambulances/**").hasAnyRole("ADMIN", "STAFF")

                // ── Hospital API (Phase 5) ────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/hospitals/**").hasAnyRole("ADMIN", "DOCTOR", "STAFF")

                // ── Notifications (Phase 5) ───────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/notifications/**").hasAnyRole("ADMIN", "DOCTOR", "STAFF")

                // ── Patient Import (Phase 5) ──────────────────────────────
                .requestMatchers("/api/import/**").hasRole("ADMIN")

                // ── Admin-only ────────────────────────────────────────────
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // All other requests must be authenticated
                .anyRequest().authenticated()
            )

            // Allow H2 console in frames (dev convenience)
            .headers(headers -> headers.frameOptions(fo -> fo.disable()))

            // Register JWT filter before the username/password filter
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
