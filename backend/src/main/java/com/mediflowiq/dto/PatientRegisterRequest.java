package com.mediflowiq.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PatientRegisterRequest {

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    private String fullName;

    private String phone;
    private String dateOfBirth; // ISO: "1990-05-14"
    private String bloodGroup;

    public String getEmail()            { return email; }
    public void setEmail(String e)      { this.email = e; }
    public String getPassword()         { return password; }
    public void setPassword(String p)   { this.password = p; }
    public String getFullName()         { return fullName; }
    public void setFullName(String fn)  { this.fullName = fn; }
    public String getPhone()            { return phone; }
    public void setPhone(String p)      { this.phone = p; }
    public String getDateOfBirth()      { return dateOfBirth; }
    public void setDateOfBirth(String d){ this.dateOfBirth = d; }
    public String getBloodGroup()       { return bloodGroup; }
    public void setBloodGroup(String bg){ this.bloodGroup = bg; }
}
