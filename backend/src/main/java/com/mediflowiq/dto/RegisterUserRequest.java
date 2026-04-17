package com.mediflowiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterUserRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;

    @NotBlank
    @Size(min = 2, max = 100)
    private String fullName;

    @NotBlank
    private String role;  // ADMIN | DOCTOR | STAFF

    public RegisterUserRequest() {}

    public String getUsername()         { return username; }
    public void setUsername(String u)   { this.username = u; }

    public String getPassword()         { return password; }
    public void setPassword(String p)   { this.password = p; }

    public String getFullName()         { return fullName; }
    public void setFullName(String fn)  { this.fullName = fn; }

    public String getRole()             { return role; }
    public void setRole(String r)       { this.role = r; }
}
