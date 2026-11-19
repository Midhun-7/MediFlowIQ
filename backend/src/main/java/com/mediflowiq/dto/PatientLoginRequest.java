package com.mediflowiq.dto;

import jakarta.validation.constraints.NotBlank;

public class PatientLoginRequest {

    @NotBlank(message = "Username or email is required")
    private String email; // Supports either username or email address

    @NotBlank(message = "Password is required")
    private String password;

    public String getEmail()            { return email; }
    public void setEmail(String e)      { this.email = e; }
    public String getPassword()         { return password; }
    public void setPassword(String p)   { this.password = p; }
}
