package com.mediflowiq.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for generating, parsing, and validating JWTs.
 * Phase 4 — Security & Roles
 */
@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey signingKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Access token ───────────────────────────────────────────────────────

    public String generateToken(Authentication authentication) {
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        return buildToken(principal.getUsername(), jwtExpirationMs);
    }

    public String generateTokenFromUsername(String username) {
        return buildToken(username, jwtExpirationMs);
    }

    // ── Refresh token ──────────────────────────────────────────────────────

    public String generateRefreshToken(String username) {
        return buildToken(username, refreshExpirationMs);
    }

    // ── Internal builder ───────────────────────────────────────────────────

    private String buildToken(String subject, long expirationMs) {
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signingKey())
                .compact();
    }

    // ── Extraction helpers ─────────────────────────────────────────────────

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.warn("[JWT] Invalid token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.warn("[JWT] Token expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.warn("[JWT] Unsupported token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("[JWT] Empty claims: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
