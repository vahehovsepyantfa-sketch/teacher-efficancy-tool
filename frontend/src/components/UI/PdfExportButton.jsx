import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

/**
 * Downloads a PDF from a protected backend endpoint (e.g.
 * /ldm/observations/:id/pdf) and saves it via the browser.
 *
 * Usage: <PdfExportButton endpoint={`/ldm/observations/${obs._id}/pdf`} filename="observation.pdf" />
 */
export default function PdfExportButton({ endpoint, filename = 'export.pdf', label = 'Ներբեռնել PDF' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('PDF արտահանումը ձախողվեց');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <button type="button" className="secondary" onClick={handleClick} disabled={loading}>
        {loading ? 'Արտահանվում է...' : label}
      </button>
      {error && <span className="error-text"> {error}</span>}
    </span>
  );
}
