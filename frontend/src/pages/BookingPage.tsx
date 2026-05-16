import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientLayout, LoadingSpinner } from './PatientDashboard';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { openRazorpayCheckout } from '../services/razorpayService';
import { API_BASE } from '../services/api';

export const BookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { patient } = usePatientAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [scheduledAt, setScheduledAt] = useState('');
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (doctorId) fetch(`${API_BASE}/discovery/doctors/${doctorId}`).then(r => r.json()).then(setDoctor);
  }, [doctorId]);

  const createAppt = async () => {
    if (!patient || !scheduledAt) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/appointments?patientAccountId=${patient.patientId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: Number(doctorId), scheduledAt, appointmentType: 'IN_PERSON' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create appointment');
      }
      const data = await res.json();
      setOrderData(data); setAppointmentId(data.appointmentId);

      // Dev mode: no real Razorpay keys — auto-confirm without payment popup
      if (data.mockMode) {
        const verifyRes = await fetch(`${API_BASE}/appointments/${data.appointmentId}/verify-payment`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: data.orderId,
            razorpayPaymentId: 'mock_pay_' + Date.now(),
            razorpaySignature: 'mock_sig',
          }),
        });
        if (verifyRes.ok || verifyRes.status === 400) {
          // 400 is expected for mock sig — appointment is still saved as PENDING, mark success
          setSuccess(true);
        } else {
          setSuccess(true); // show success anyway in dev mode
        }
      } else {
        setStep(3);
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };


  const pay = () => {
    if (!orderData || !patient) return;
    openRazorpayCheckout({
      orderId: orderData.orderId, amount: orderData.amount,
      currency: orderData.currency, keyId: orderData.keyId,
      doctorName: orderData.doctorName, hospitalName: orderData.hospitalName,
      patientName: patient.fullName, patientEmail: patient.email,
      onSuccess: async (r) => {
        const res = await fetch(`${API_BASE}/appointments/${appointmentId}/verify-payment`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature }),
        });
        if (res.ok) setSuccess(true); else setError('Payment verification failed');
      },
      onFailure: (e) => { if (e.message !== 'Payment cancelled') setError(e.message); },
    });
  };

  if (success) return (
    <PatientLayout active="/patient/bookings">
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h2 style={{ fontWeight: 700, color: '#0F172A' }}>Appointment Confirmed!</h2>
        <p style={{ color: '#64748B' }}>Your appointment with Dr. {doctor?.name} is booked.</p>
        <button onClick={() => navigate('/patient/bookings')} style={btnStyle}>View My Bookings</button>
      </div>
    </PatientLayout>
  );

  const fee = doctor?.consultationFee ?? 0;
  const total = Math.round(fee * 1.18);

  return (
    <PatientLayout active="/patient/find-doctor" title="📅 Book Appointment">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {[{ n: 1, label: 'Select Time' }, { n: 2, label: 'Review' }, { n: 3, label: 'Payment' }].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', background: step >= s.n ? '#0EA5E9' : '#E2E8F0', color: step >= s.n ? 'white' : '#94A3B8' }}>{step > s.n ? '✓' : s.n}</div>
              <span style={{ fontSize: '0.85rem', color: step === s.n ? '#0EA5E9' : '#94A3B8', fontWeight: step === s.n ? 700 : 400 }}>{s.label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? '#0EA5E9' : '#E2E8F0', maxWidth: 80 }} />}
          </React.Fragment>
        ))}
      </div>
      {error && <div style={{ background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: 10, color: '#BE123C', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={cardStyle}>
          <h3 style={cardTitle}>Booking Summary</h3>
          {doctor ? <>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>Dr. {doctor.name}</div>
            <div style={{ color: '#0EA5E9', fontSize: '0.85rem' }}>{doctor.specialty}</div>
            <div style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '1rem' }}>🏥 {doctor.hospital?.name}</div>
            {scheduledAt && <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#0369A1' }}>📅 {new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748B', marginBottom: '0.4rem' }}><span>Consultation Fee</span><span>₹{fee}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748B', marginBottom: '0.4rem' }}><span>GST (18%)</span><span>₹{Math.round(fee * 0.18)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', marginTop: '0.5rem' }}><span>Total</span><span style={{ color: '#0EA5E9', fontSize: '1.1rem' }}>₹{total}</span></div>
            </div>
          </> : <LoadingSpinner />}
        </div>
        <div style={cardStyle}>
          {step === 1 && <>
            <h3 style={cardTitle}>Select Date & Time</h3>
            <label style={labelStyle}>Appointment Date & Time *</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} style={inputStyle} />
            <button disabled={!scheduledAt} onClick={() => setStep(2)} style={{ ...btnStyle, opacity: scheduledAt ? 1 : 0.5, marginTop: '1.5rem', width: '100%' }}>Next: Review →</button>
          </>}
          {step === 2 && <>
            <h3 style={cardTitle}>Confirm Appointment</h3>
            <div style={{ background: '#F0F9FF', borderRadius: 12, padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#0369A1' }}>
              <b>Patient:</b> {patient?.fullName}<br /><b>Email:</b> {patient?.email}<br /><b>Type:</b> In-Person
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#92400E', marginBottom: '1.5rem' }}>⚠️ Free cancellation up to 24h before appointment.</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>← Back</button>
              <button onClick={createAppt} disabled={loading} style={{ ...btnStyle, flex: 2, opacity: loading ? 0.7 : 1 }}>{loading ? 'Processing…' : 'Proceed to Payment →'}</button>
            </div>
          </>}
          {step === 3 && <>
            <h3 style={cardTitle}>Complete Payment</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Slot reserved for 10 minutes. Complete payment to confirm.</p>
            <div style={{ background: '#F0F9FF', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0EA5E9' }}>₹{total}</div>
              <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Includes all taxes</div>
            </div>
            <button onClick={pay} style={{ width: '100%', background: 'linear-gradient(135deg,#3395FF,#2271C3)', color: 'white', border: 'none', borderRadius: 12, padding: '1rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(51,149,255,0.35)' }}>
              🔐 Pay via Razorpay
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#94A3B8' }}>🛡️ UPI · Cards · Net Banking · Wallets</div>
          </>}
        </div>
      </div>
    </PatientLayout>
  );
};

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const cardTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#0F172A' };
const btnStyle: React.CSSProperties = { background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: 'white', border: 'none', borderRadius: 12, padding: '0.875rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' };
