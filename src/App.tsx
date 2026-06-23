import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, Navigate, useNavigate } from 'react-router-dom';
import { Activity, Users, Settings, Plus, User, FileText, Search, Download, ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import useSWR, { mutate } from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('kms_token');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
};

import GrowthChart from './components/GrowthChart';
import { exportPatientToPDF } from './utils/pdfExport';
import NewPatientModal from './components/NewPatientModal';
import NewVisitModal from './components/NewVisitModal';
import Login from './pages/Login';
import { getAgeInMonths, formatAge, evaluateWFA, evaluateHFA, evaluateWFH, evaluateBMI } from './utils/zscore';
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('kms_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{name: string, clinic?: string, rmPrefix?: string}>({ name: 'Ahli Gizi', clinic: 'Puskesmas' });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('kms_user');
    if (userStr) {
      try { setUserProfile(JSON.parse(userStr)); } catch(e){}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kms_token');
    localStorage.removeItem('kms_user');
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="logo">
          <Activity size={24} color="var(--color-primary)" />
          <span>KMS Digital</span>
        </div>
        <button onClick={() => setIsMobileSidebarOpen(true)} className="neumorphic-button" style={{ padding: '8px', display: 'flex', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarMinimized ? 'minimized' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo" style={{ justifyContent: isSidebarMinimized ? 'center' : 'flex-start', width: '100%' }}>
            <Activity size={32} color="var(--color-primary)" />
            {!isSidebarMinimized && <span>KMS Digital</span>}
          </div>
          {isMobileSidebarOpen && (
             <button onClick={() => setIsMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-foreground)', cursor: 'pointer' }}>
               <X size={24} />
             </button>
          )}
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
          <Link to="/" onClick={() => setIsMobileSidebarOpen(false)} className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} style={{ justifyContent: isSidebarMinimized ? 'center' : 'flex-start' }}>
            <Activity size={20} />
            {!isSidebarMinimized && <span className="nav-text">Dashboard</span>}
          </Link>
          <Link to="/patients" onClick={() => setIsMobileSidebarOpen(false)} className={`nav-item ${location.pathname.startsWith('/patients') ? 'active' : ''}`} style={{ justifyContent: isSidebarMinimized ? 'center' : 'flex-start' }}>
            <Users size={20} />
            {!isSidebarMinimized && <span className="nav-text">Data Pasien</span>}
          </Link>
          <Link to="/settings" onClick={() => setIsMobileSidebarOpen(false)} className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`} style={{ justifyContent: isSidebarMinimized ? 'center' : 'flex-start' }}>
            <Settings size={20} />
            {!isSidebarMinimized && <span className="nav-text">Pengaturan</span>}
          </Link>
        </nav>

        <div className="user-info" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: isSidebarMinimized ? 'center' : 'flex-start', gap: '12px', padding: isSidebarMinimized ? '12px' : '16px', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={20} />
          </div>
          {!isSidebarMinimized && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile.clinic || 'Klinik / Puskesmas'}</div>
            </div>
          )}
        </div>
        
        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0d9488', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: isSidebarMinimized ? '12px 0' : '12px 16px', width: '100%', justifyContent: isSidebarMinimized ? 'center' : 'flex-start' }}
          >
            <LogOut size={20} />
            {!isSidebarMinimized && <span className="logout-text">Keluar</span>}
          </button>

          {/* Desktop Minimize Toggle */}
          <button 
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-foreground)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: isSidebarMinimized ? '12px 0' : '12px 16px', width: '100%', justifyContent: isSidebarMinimized ? 'center' : 'flex-start', opacity: 0.5 }}
          >
            {isSidebarMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isSidebarMinimized && <span className="logout-text">Minimize</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage onUpdateProfile={(newProf) => setUserProfile(prev => ({...prev, ...newProf}))} /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const { data: stats, error } = useSWR('/api/dashboard', fetcher);
  const loading = !stats && !error;

  const displayStats = stats || { totalPatients: 0, visitsToday: 0, interventionCount: 0 };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Ringkasan pemantauan pertumbuhan anak wilayah Anda.</p>
      </div>

      {loading ? (
        <div style={{ padding: '24px', opacity: 0.7 }}>Memuat data statistik...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div className="neumorphic-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <Users size={24} />
              </div>
            </div>
            <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>{displayStats.totalPatients}</h2>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Total Pasien Terdaftar</p>
          </div>

          <div className="neumorphic-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-destructive)' }}>
                <Activity size={24} />
              </div>
            </div>
            <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>{displayStats.interventionCount}</h2>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Perlu Intervensi Medis</p>
          </div>

          <div className="neumorphic-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <FileText size={24} />
              </div>
            </div>
            <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>{displayStats.visitsToday}</h2>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Kunjungan Hari Ini</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: patients, error } = useSWR('/api/patients', fetcher);
  const loading = !patients && !error;
  const displayPatients = patients || [];

  const handleDeletePatient = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus pasien ${name} beserta seluruh riwayat kunjungannya?`)) return;
    
    // Optimistic UI Delete
    mutate('/api/patients', displayPatients.filter((p: any) => p.id !== id), false);
    try {
      const token = localStorage.getItem('kms_token');
      const res = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        mutate('/api/patients');
      } else {
        alert('Gagal menghapus data.');
        mutate('/api/patients'); // revert
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
      mutate('/api/patients'); // revert
    }
  };

  const getNextRmNumber = () => {
    const userStr = localStorage.getItem('kms_user');
    let prefix = 'RM-';
    if (userStr) {
      try { 
        const u = JSON.parse(userStr);
        if (u.rmPrefix) prefix = u.rmPrefix;
      } catch(e){}
    }

    let maxNum = 0;
    displayPatients.forEach((p: any) => {
      if (p.rmNumber && p.rmNumber.startsWith(prefix)) {
        const numPart = p.rmNumber.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  };

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Data Pasien Anak</h1>
          <p>Kelola rekam medis dan riwayat pemantauan anak.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="neumorphic-button primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} />
          Pasien Baru
        </button>
      </div>
      
      <NewPatientModal 
        isOpen={isModalOpen} 
        suggestedRmNumber={getNextRmNumber()}
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          alert('Data tersimpan!');
          mutate('/api/patients');
        }} 
      />

      <div className="neumorphic-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="neumorphic-input" 
            placeholder="Cari nama atau nomor rekam medis..." 
            style={{ paddingLeft: '48px' }}
          />
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. RM</th>
              <th>Nama Pasien</th>
              <th>Usia</th>
              <th>Jenis Kelamin</th>
              <th>Status Gizi Terakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
            ) : displayPatients.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data pasien.</td></tr>
            ) : (
              displayPatients.map((p: any) => {
                const age = getAgeInMonths(new Date(p.dateOfBirth));
                const latestRecord = p.records?.[0];
                const status = latestRecord && latestRecord.zScoreWFA != null ? evaluateWFA(latestRecord.zScoreWFA) : 'Belum Ada Data';
                
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.rmNumber || p.id.slice(-5)}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{formatAge(age)}</td>
                    <td>{p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td>
                      <span className={`status-badge ${
                        status.includes('Normal') ? 'status-normal' : 
                        status.includes('Kurang') || status.includes('Buruk') ? 'status-danger' : 
                        status === 'Belum Ada Data' ? '' : 'status-warning'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/patients/${p.id}`} className="neumorphic-button" style={{ padding: '6px 12px', fontSize: '14px', textDecoration: 'none' }}>
                        Detail
                      </Link>
                      <button onClick={() => handleDeletePatient(p.id, p.name)} className="neumorphic-button" style={{ padding: '6px 12px', fontSize: '14px', color: 'var(--color-destructive)' }}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatientDetail() {
  const { id } = useParams();
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [selectedRecordToEdit, setSelectedRecordToEdit] = useState<any>(null);
  const { data: patient, error } = useSWR(id ? `/api/patients/${id}` : null, fetcher);

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Yakin ingin menghapus riwayat kunjungan ini?')) return;
    
    if (patient) {
      const updatedPatient = {
        ...patient,
        records: patient.records.filter((r: any) => r.id !== recordId)
      };
      mutate(`/api/patients/${id}`, updatedPatient, false);
    }

    try {
      const token = localStorage.getItem('kms_token');
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        mutate(`/api/patients/${id}`);
      } else {
        alert('Gagal menghapus kunjungan.');
        mutate(`/api/patients/${id}`); // revert
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
      mutate(`/api/patients/${id}`); // revert
    }
  };

  if (!patient) return <div style={{ padding: '48px' }}>Memuat data pasien...</div>;

  // Format records for the chart
  const growthData = patient.records ? patient.records.map((r: any) => ({
    ageMonths: getAgeInMonths(new Date(patient.dateOfBirth), new Date(r.date)),
    weight: r.weight,
    height: r.height
  })).reverse() : [];

  return (
    <div id="patient-record-export">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-foreground)', textDecoration: 'none', marginBottom: '8px', opacity: 0.7 }}>
            <ChevronLeft size={16} /> Kembali
          </Link>
          <h1>Rekam Medis: {patient.rmNumber || id}</h1>
          <p>Detail pasien, riwayat kunjungan, dan grafik KMS.</p>
        </div>
        <button onClick={() => exportPatientToPDF('patient-record-export', patient.name)} className="neumorphic-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} />
          Cetak PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="neumorphic-card">
          <h3 style={{ marginBottom: '16px' }}>Profil Anak</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div className="form-label">Nama</div>
              <div style={{ fontWeight: 600 }}>{patient.name}</div>
            </div>
            <div>
              <div className="form-label">Jenis Kelamin</div>
              <div>{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
            </div>
            <div>
              <div className="form-label">Tanggal Lahir</div>
              <div>{new Date(patient.dateOfBirth).toLocaleDateString('id-ID')}</div>
            </div>
            <div>
              <div className="form-label">Usia Saat Ini</div>
              <div style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                {formatAge(getAgeInMonths(new Date(patient.dateOfBirth), new Date()))}
              </div>
            </div>
            <div>
              <div className="form-label">Nama Orang Tua</div>
              <div>{patient.parentName}</div>
            </div>
            <div>
              <div className="form-label">Alamat</div>
              <div>{patient.address}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsEditPatientOpen(true)} className="neumorphic-button" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                Edit Profil
              </button>
              <button onClick={() => { setSelectedRecordToEdit(null); setIsVisitModalOpen(true); }} className="neumorphic-button primary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                + Kunjungan
              </button>
            </div>
          </div>
        </div>

        <div className="neumorphic-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h3 style={{ marginBottom: '8px' }}>a). Berat Badan / Umur (BB/U)</h3>
            {patient.records && patient.records.length > 0 && patient.records[0].zScoreWFA != null ? (
              <p style={{ marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>
                Nilai Z Score : {(patient.records[0].zScoreWFA).toFixed(2)} <span style={{ color: patient.records[0].zScoreWFA >= -2 && patient.records[0].zScoreWFA <= 1 ? 'var(--color-primary)' : 'var(--color-destructive)' }}>({evaluateWFA(patient.records[0].zScoreWFA)})</span>
              </p>
            ) : null}
            {growthData.length > 0 ? (
              <GrowthChart type="WFA" gender={patient.gender} records={growthData} />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>Belum ada data kunjungan.</div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>b). Tinggi Badan / Umur (TB/U)</h3>
            {patient.records && patient.records.length > 0 && patient.records[0].zScoreHFA != null ? (
              <p style={{ marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>
                Nilai Z Score : {(patient.records[0].zScoreHFA).toFixed(2)} <span style={{ color: patient.records[0].zScoreHFA >= -2 && patient.records[0].zScoreHFA <= 3 ? 'var(--color-primary)' : 'var(--color-destructive)' }}>({evaluateHFA(patient.records[0].zScoreHFA)})</span>
              </p>
            ) : null}
            {growthData.length > 0 ? (
              <GrowthChart type="HFA" gender={patient.gender} records={growthData} />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>Belum ada data kunjungan.</div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>c). Berat Badan / Tinggi Badan (BB/TB)</h3>
            {patient.records && patient.records.length > 0 && patient.records[0].zScoreWFH != null ? (
              <p style={{ marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>
                Nilai Z Score : {(patient.records[0].zScoreWFH).toFixed(2)} <span style={{ color: patient.records[0].zScoreWFH >= -2 && patient.records[0].zScoreWFH <= 1 ? 'var(--color-primary)' : 'var(--color-destructive)' }}>({evaluateWFH(patient.records[0].zScoreWFH)})</span>
              </p>
            ) : null}
            {growthData.length > 0 ? (
              <GrowthChart type="WFH" gender={patient.gender} records={growthData} />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>Belum ada data kunjungan.</div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>d). Indeks Masa Tubuh / Umur (IMT/U)</h3>
            {patient.records && patient.records.length > 0 && patient.records[0].zScoreBMI != null ? (
              <p style={{ marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>
                Nilai Z Score : {(patient.records[0].zScoreBMI).toFixed(2)} <span style={{ color: patient.records[0].zScoreBMI >= -2 && patient.records[0].zScoreBMI <= 1 ? 'var(--color-primary)' : 'var(--color-destructive)' }}>({evaluateBMI(patient.records[0].zScoreBMI)})</span>
              </p>
            ) : null}
            {growthData.length > 0 ? (
              <GrowthChart type="BMI" gender={patient.gender} records={growthData} />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>Belum ada data kunjungan.</div>
            )}
          </div>
          
          {patient.records && patient.records.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Riwayat Kunjungan</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Usia Saat Kunjungan</th>
                      <th>BB (kg)</th>
                      <th>TB (cm)</th>
                      <th>Catatan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.records.map((r: any) => (
                      <tr key={r.id}>
                        <td>{new Date(r.date).toLocaleDateString('id-ID')}</td>
                        <td>{formatAge(getAgeInMonths(new Date(patient.dateOfBirth), new Date(r.date)))}</td>
                        <td>{r.weight}</td>
                        <td>{r.height}</td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.consultationNotes || '-'}
                        </td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => {
                            setSelectedRecordToEdit(r);
                            setIsVisitModalOpen(true);
                          }} className="neumorphic-button" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteRecord(r.id)} className="neumorphic-button" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-destructive)' }}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <NewPatientModal 
        isOpen={isEditPatientOpen}
        initialData={patient}
        onClose={() => setIsEditPatientOpen(false)}
        onSuccess={() => {
          alert('Profil diperbarui!');
          mutate(`/api/patients/${id}`);
          mutate('/api/patients'); // Also update list
        }}
      />
      
      <NewVisitModal 
        isOpen={isVisitModalOpen}
        patientId={id || ''}
        initialData={selectedRecordToEdit}
        onClose={() => {
          setIsVisitModalOpen(false);
          setSelectedRecordToEdit(null);
        }}
        onSuccess={() => {
          alert(selectedRecordToEdit ? 'Kunjungan diperbarui!' : 'Kunjungan tersimpan!');
          mutate(`/api/patients/${id}`);
        }}
      />
    </div>
  );
}

function SettingsPage({ onUpdateProfile }: { onUpdateProfile: (prof: any) => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({ name: '', clinic: '', rmPrefix: 'RM-' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('kms_token');
        const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfileForm({ name: data.name || '', clinic: data.clinic || '', rmPrefix: data.rmPrefix || 'RM-' });
          
          // update localstorage
          const oldStr = localStorage.getItem('kms_user');
          if (oldStr) {
            const old = JSON.parse(oldStr);
            const merged = { ...old, ...data };
            localStorage.setItem('kms_user', JSON.stringify(merged));
            onUpdateProfile(merged);
          }
        }
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('kms_token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        alert('Profil berhasil diperbarui!');
        const oldStr = localStorage.getItem('kms_user');
        if (oldStr) {
          const old = JSON.parse(oldStr);
          const merged = { ...old, ...data };
          localStorage.setItem('kms_user', JSON.stringify(merged));
          onUpdateProfile(merged);
        }
      } else {
        alert('Gagal memperbarui profil');
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('kms_token');
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(passwordForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password berhasil diubah!');
        setPasswordForm({ oldPassword: '', newPassword: '' });
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('kms_token');
      const res = await fetch('/api/export', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "laporan_kms_digital.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengekspor data');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengekspor data');
    }
  };

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Pengaturan Sistem</h1>
          <p>Kustomisasi profil, keamanan, dan ekspor data.</p>
        </div>
        <button onClick={handleExport} className="neumorphic-button primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} />
          Unduh CSV Pasien
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setActiveTab('profile')} className={`neumorphic-button ${activeTab === 'profile' ? 'primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'profile' ? '' : 'transparent', boxShadow: activeTab === 'profile' ? '' : 'none', border: '1px solid var(--color-border)' }}>
            Profil & Preferensi
          </button>
          <button onClick={() => setActiveTab('security')} className={`neumorphic-button ${activeTab === 'security' ? 'primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'security' ? '' : 'transparent', boxShadow: activeTab === 'security' ? '' : 'none', border: '1px solid var(--color-border)' }}>
            Keamanan Akun
          </button>
        </div>

        <div className="neumorphic-card">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>Profil Puskesmas / Klinik</h3>
              <div>
                <label className="form-label">Nama Lengkap (Ahli Gizi / Dokter)</label>
                <input required type="text" className="neumorphic-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Nama Fasilitas Kesehatan</label>
                <input required type="text" className="neumorphic-input" value={profileForm.clinic} onChange={e => setProfileForm({...profileForm, clinic: e.target.value})} />
              </div>

              <h3 style={{ marginTop: '16px', marginBottom: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>Kustomisasi Nomor Rekam Medis</h3>
              <div>
                <label className="form-label">Awalan (Prefix) Rekam Medis</label>
                <input required type="text" className="neumorphic-input" value={profileForm.rmPrefix} onChange={e => setProfileForm({...profileForm, rmPrefix: e.target.value})} placeholder="Contoh: RM-" />
                <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Setiap kali Anda menekan Tambah Pasien Baru, sistem akan otomatis melanjutkan nomor dari awalan ini.</p>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="neumorphic-button primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>Ubah Password</h3>
              <div>
                <label className="form-label">Password Lama</label>
                <input required type="password" className="neumorphic-input" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Password Baru</label>
                <input required type="password" className="neumorphic-input" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="neumorphic-button primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
