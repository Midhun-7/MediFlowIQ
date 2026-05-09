package com.mediflowiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;

    /** Optional — required only when role = DOCTOR. NMC Unique ID issued by National Medical Commission. */
    private String nmcUid;

    public LoginRequest() {}

    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }

    public String getPassword() { return password; }
    public void setPassword(String p) { this.password = p; }

    public String getNmcUid() { return nmcUid; }
    public void setNmcUid(String n) { this.nmcUid = n; }
}
