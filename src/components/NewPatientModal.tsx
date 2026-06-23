import React, { useState } from 'react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function NewPatientModal({ isOpen, onClose, onSuccess, initialData }: NewPatientModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    rmNumber: initialData?.rmNumber || '',
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    gender: initialData?.gender || 'L',
    parentName: initialData?.parentName || '',
    address: initialData?.address || ''
  });
  const [loading, setLoading] = useState(false);

  // Sync state if initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        rmNumber: initialData.rmNumber || '',
        dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: initialData.gender || 'L',
        parentName: initialData.parentName || '',
        address: initialData.address || ''
      });
    } else {
      setFormData({ name: '', rmNumber: '', dateOfBirth: '', gender: 'L', parentName: '', address: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/patients/${initialData.id}` : '/api/patients';
      
      const token = localStorage.getItem('kms_token');
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        throw new Error('Gagal menyimpan data pasien');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan pasien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(19, 78, 74, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="neumorphic-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
        <h2 style={{ marginBottom: '24px' }}>{initialData ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Nomor Rekam Medis</label>
            <input required type="text" className="neumorphic-input" value={formData.rmNumber} onChange={e => setFormData({...formData, rmNumber: e.target.value})} placeholder="Contoh: RM-004" />
          </div>
          <div>
            <label className="form-label">Nama Anak</label>
            <input required type="text" className="neumorphic-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama lengkap anak" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="form-label">Tanggal Lahir</label>
              <input required type="date" className="neumorphic-input" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Jenis Kelamin</label>
              <select className="neumorphic-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Nama Orang Tua</label>
            <input required type="text" className="neumorphic-input" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} placeholder="Nama Ibu/Ayah" />
          </div>
          <div>
            <label className="form-label">Alamat Lengkap</label>
            <textarea required className="neumorphic-input" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat rumah..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="neumorphic-button" style={{ backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid var(--color-border)' }}>Batal</button>
            <button type="submit" className="neumorphic-button primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Pasien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
