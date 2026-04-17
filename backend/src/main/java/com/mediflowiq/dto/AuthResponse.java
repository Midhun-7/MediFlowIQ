package com.mediflowiq.dto;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private String role;
    private long expiresIn; // seconds

    public AuthResponse() {}

    public AuthResponse(String accessToken, String refreshToken,
                        String username, String fullName, String role, long expiresIn) {
        this.accessToken  = accessToken;
        this.refreshToken = refreshToken;
        this.username     = username;
        this.fullName     = fullName;
        this.role         = role;
        this.expiresIn    = expiresIn;
    }

    public String getAccessToken()  { return accessToken; }
    public void setAccessToken(String t) { this.accessToken = t; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String t) { this.refreshToken = t; }

    public String getTokenType()    { return tokenType; }

    public String getUsername()     { return username; }
    public void setUsername(String u) { this.username = u; }

    public String getFullName()     { return fullName; }
    public void setFullName(String fn) { this.fullName = fn; }

    public String getRole()         { return role; }
    public void setRole(String r)   { this.role = r; }

    public long getExpiresIn()      { return expiresIn; }
    public void setExpiresIn(long e) { this.expiresIn = e; }
}
