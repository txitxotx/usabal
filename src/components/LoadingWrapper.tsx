'use client';

export default function LoadingWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children ?? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2eaf4', borderTop: '3px solid #0057a8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Cargando datos...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}
