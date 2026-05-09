package com.mediflowiq.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload sent by the frontend after Razorpay payment success. */
public class VerifyPaymentRequest {

    @NotBlank
    private String razorpayOrderId;

    @NotBlank
    private String razorpayPaymentId;

    @NotBlank
    private String razorpaySignature;

    public String getRazorpayOrderId()              { return razorpayOrderId; }
    public void setRazorpayOrderId(String id)       { this.razorpayOrderId = id; }
    public String getRazorpayPaymentId()            { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String id)     { this.razorpayPaymentId = id; }
    public String getRazorpaySignature()            { return razorpaySignature; }
    public void setRazorpaySignature(String sig)    { this.razorpaySignature = sig; }
}
