package com.mediflowiq.dto;

import com.mediflowiq.model.Priority;
import jakarta.validation.constraints.*;

public class RegisterPatientRequest {

    @NotBlank(message = "Patient name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be 0 or greater")
    @Max(value = 150, message = "Age must be realistic")
    private Integer age;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @Size(max = 500, message = "Symptoms description too long")
    private String symptoms;

    public RegisterPatientRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
}
