import React, { useState } from 'react';

interface NewVisitModalProps {
  isOpen: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function NewVisitModal({ isOpen, patientId, onClose, onSuccess, initialData }: NewVisitModalProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    weight: initialData?.weight || '',
    height: initialData?.height || '',
    headCircum: initialData?.headCircum || '',
    lila: initialData?.lila || '',
    consultationNotes: initialData?.consultationNotes || ''
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        weight: initialData.weight || '',
        height: initialData.height || '',
        headCircum: initialData.headCircum || '',
        lila: initialData.lila || '',
        consultationNotes: initialData.consultationNotes || ''
      });
    } else {
      setFormData({ date: new Date().toISOString().split('T')[0], weight: '', height: '', headCircum: '', lila: '', consultationNotes: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/records/${initialData.id}` : '/api/records';
      
      const token = localStorage.getItem('kms_token');
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          date: isEdit ? new Date(formData.date).toISOString() : undefined,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          headCircum: formData.headCircum ? parseFloat(formData.headCircum) : undefined,
          lila: formData.lila ? parseFloat(formData.lila) : undefined,
          consultationNotes: formData.consultationNotes
        })
      });
      
      if (!res.ok) {
        throw new Error('Gagal menyimpan rekam medis');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan kunjungan.');
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
      <div className="neumorphic-card" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
        <h2 style={{ marginBottom: '24px' }}>{initialData ? 'Edit Rekam Antropometri' : 'Tambah Rekam Antropometri'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {initialData && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Tanggal Kunjungan</label>
                <input type="date" className="neumorphic-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            )}
            <div>
              <label className="form-label">Berat Badan (kg)</label>
              <input required type="number" step="0.1" className="neumorphic-input" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="Contoh: 8.5" />
            </div>
            <div>
              <label className="form-label">Panjang/Tinggi Badan (cm)</label>
              <input required type="number" step="0.1" className="neumorphic-input" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="Contoh: 70.2" />
            </div>
            <div>
              <label className="form-label">Lingkar Kepala (cm) - Opsional</label>
              <input type="number" step="0.1" className="neumorphic-input" value={formData.headCircum} onChange={e => setFormData({...formData, headCircum: e.target.value})} placeholder="Contoh: 45" />
            </div>
            <div>
              <label className="form-label">LILA (cm) - Opsional</label>
              <input type="number" step="0.1" className="neumorphic-input" value={formData.lila} onChange={e => setFormData({...formData, lila: e.target.value})} placeholder="Contoh: 14" />
            </div>
          </div>
          
          <div>
            <label className="form-label">Catatan Konsultasi / Intervensi (Opsional)</label>
            <textarea className="neumorphic-input" rows={3} value={formData.consultationNotes} onChange={e => setFormData({...formData, consultationNotes: e.target.value})} placeholder="Masukkan catatan ahli gizi..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="neumorphic-button" style={{ backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid var(--color-border)' }}>Batal</button>
            <button type="submit" className="neumorphic-button primary" disabled={loading}>
              {loading ? 'Menyimpan & Menghitung...' : 'Simpan & Hitung Z-Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
