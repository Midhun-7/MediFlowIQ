import React, { createContext, useContext, useState, useCallback } from 'react';

interface PatientUser {
  patientId: number;
  fullName: string;
  email: string;
  role: 'PATIENT';
}

interface PatientAuthContextType {
  patient: PatientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, patientData: PatientUser) => void;
  logout: () => void;
}

const PatientAuthContext = createContext<PatientAuthContextType | null>(null);

export const usePatientAuth = () => {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error('usePatientAuth must be used within PatientAuthProvider');
  return ctx;
};

export const PatientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('patient_token'));
  const [patient, setPatient] = useState<PatientUser | null>(() => {
    const raw = localStorage.getItem('patient_data');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((newToken: string, patientData: PatientUser) => {
    localStorage.setItem('patient_token', newToken);
    localStorage.setItem('patient_data', JSON.stringify(patientData));
    setToken(newToken);
    setPatient(patientData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_data');
    setToken(null);
    setPatient(null);
  }, []);

  return (
    <PatientAuthContext.Provider value={{ patient, token, isAuthenticated: !!token && !!patient, login, logout }}>
      {children}
    </PatientAuthContext.Provider>
  );
};
