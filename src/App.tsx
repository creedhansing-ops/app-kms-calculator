import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { Activity, Users, Settings, Plus, User, FileText, Search, Download, ChevronLeft } from 'lucide-react';
import GrowthChart from './components/GrowthChart';
import { exportPatientToPDF } from './utils/pdfExport';
import NewPatientModal from './components/NewPatientModal';
import NewVisitModal from './components/NewVisitModal';
import { getAgeInMonths, formatAge, evaluateWFA } from './utils/zscore';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo">
          <Activity size={32} color="var(--color-primary)" />
          KMS Digital
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Activity size={20} />
            Dashboard
          </Link>
          <Link to="/patients" className={`nav-item ${location.pathname.startsWith('/patients') ? 'active' : ''}`}>
            <Users size={20} />
            Data Pasien
          </Link>
          <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={20} />
            Pengaturan
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Ahli Gizi</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Puskesmas Pusat</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
        </Routes>
      </main>
    </div>
  );
}

// Temporary inline components for rapid prototyping
function Dashboard() {
  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Ringkasan pemantauan pertumbuhan anak wilayah Anda.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="neumorphic-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--color-primary)' }}>
              <Users size={24} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>+12 Bulan Ini</span>
          </div>
          <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>1,248</h2>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Total Pasien Terdaftar</p>
        </div>

        <div className="neumorphic-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--color-destructive)' }}>
              <Activity size={24} />
            </div>
          </div>
          <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>14</h2>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Perlu Intervensi (Gizi Buruk)</p>
        </div>

        <div className="neumorphic-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--color-primary)' }}>
              <FileText size={24} />
            </div>
          </div>
          <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '4px' }}>42</h2>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Kunjungan Hari Ini</p>
        </div>
      </div>
    </div>
  );
}

function PatientList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          alert('Data tersimpan!');
          fetchPatients();
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
            ) : patients.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data pasien.</td></tr>
            ) : (
              patients.map(p => {
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
                    <td>
                      <Link to={`/patients/${p.id}`} className="neumorphic-button" style={{ padding: '6px 12px', fontSize: '14px', textDecoration: 'none' }}>
                        Detail
                      </Link>
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
  const [patient, setPatient] = useState<any>(null);
  
  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (res.ok) {
        setPatient(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

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

        <div className="neumorphic-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ marginBottom: '16px' }}>Grafik Pertumbuhan KMS (BB/U)</h3>
            {growthData.length > 0 ? (
              <GrowthChart data={growthData} type="BB/U" />
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>Belum ada data kunjungan. Silakan tambah kunjungan pertama.</div>
            )}
          </div>
          
          {patient.records && patient.records.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '16px' }}>Riwayat Kunjungan</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
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
                        <td>{r.weight}</td>
                        <td>{r.height}</td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.consultationNotes || '-'}
                        </td>
                        <td>
                          <button onClick={() => {
                            setSelectedRecordToEdit(r);
                            setIsVisitModalOpen(true);
                          }} className="neumorphic-button" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            Edit
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
          fetchPatient();
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
          fetchPatient();
        }}
      />
    </div>
  );
}

