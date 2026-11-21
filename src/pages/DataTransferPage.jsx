import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, FileUp, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { readSheet } from 'read-excel-file/browser';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';
import { googleClientId, requestDriveFileAccess } from '../integrations/google.js';

const farmerHeaders = [
  'barangayId', 'registryNumber', 'firstName', 'middleName', 'lastName',
  'suffix', 'sex', 'birthDate', 'phone', 'email', 'address', 'primaryLivelihood',
];

const importSchemas = {
  farmers: farmerHeaders,
  farms: ['farmerRegistryNumber', 'farmName', 'locationDescription', 'ownershipType', 'latitude', 'longitude', 'areaHectares'],
  harvests: ['farmerRegistryNumber', 'farmName', 'harvestedOn', 'quantity', 'unit', 'qualityNotes', 'cropPlantingId', 'ricePlantingId', 'productionId'],
  livestock: ['farmerRegistryNumber', 'farmName', 'category', 'quantity', 'acquiredOn', 'notes'],
};

function quoteCsv(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function quoteImportCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows, headers) {
  const contents = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ].map((row) => row.map(quoteCsv).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function importErrors(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DataTransferPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [file, setFile] = useState(null);
  const [importModule, setImportModule] = useState('farmers');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const exportModules = user.role === 'farmer'
    ? ['farms', 'harvests']
    : ['farmers', 'farms', 'harvests', 'livestock'];

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [historyResponse, barangayResponse] = await Promise.all([
        api.get('/api/imports'),
        api.get('/api/barangays'),
      ]);
      setHistory(historyResponse.data.data);
      setBarangays(barangayResponse.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function exportModule(module) {
    setError('');
    try {
      const response = await api.get(`/api/exports/${module}`);
      const rows = response.data.data.rows;
      if (!rows.length) {
        toast('No records are available in your authorized scope.');
        return;
      }
      downloadCsv(`agritrack-${module}-${new Date().toISOString().slice(0, 10)}.csv`, rows, Object.keys(rows[0]));
      toast.success(`${rows.length.toLocaleString()} ${module} records exported.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  function downloadTemplate(module) {
    downloadCsv(`agritrack-${module}-template.csv`, [], importSchemas[module]);
  }

  async function fileAsCsv(selectedFile) {
    if (/\.xlsx$/i.test(selectedFile.name)) {
      const rows = await readSheet(selectedFile);
      if (rows.length > 501 || rows.some((row) => row.length > 20)) {
        throw new Error('The worksheet exceeds the supported import size.');
      }
      return rows.map((row) => row.map((value) => {
        const normalized = value instanceof Date ? value.toISOString().slice(0, 10) : value;
        return quoteImportCsv(normalized);
      }).join(',')).join('\r\n');
    }
    if (!/\.csv$/i.test(selectedFile.name)) throw new Error('Choose a CSV or XLSX file.');
    return selectedFile.text();
  }

  async function importFarmers(event) {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setError('');
    setImportResult(null);
    try {
      if (file.size > 2000000) throw new Error('Import file must be smaller than 2 MB.');
      const csv = await fileAsCsv(file);
      if (!csv || csv.length > 2000000) throw new Error('Converted import data must contain rows and be smaller than 2 MB.');
      const endpoint = importModule === 'farmers' ? '/api/imports/farmers' : `/api/imports/${importModule}`;
      const response = await api.post(endpoint, { filename: file.name, csv });
      setImportResult(response.data.data);
      setFile(null);
      event.target.reset();
      await loadHistory();
      if (response.data.data.importedRows > 0) toast.success(`${response.data.data.importedRows} ${importModule} records imported.`);
      else toast.error('No rows were imported. Review the row errors below.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function exportToGoogleSheets(module) {
    setError('');
    setGoogleSheetUrl('');
    try {
      const response = await api.get(`/api/exports/${module}`);
      const rows = response.data.data.rows;
      if (!rows.length) {
        toast('No records are available in your authorized scope.');
        return;
      }
      const accessToken = await requestDriveFileAccess();
      const headers = Object.keys(rows[0]);
      const values = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))];
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: `AGRI-TRACK ${module} ${new Date().toISOString().slice(0, 10)}` },
          sheets: [{ properties: { title: 'Records' } }],
        }),
      });
      if (!createResponse.ok) throw new Error('Google Sheets could not create the spreadsheet.');
      const spreadsheet = await createResponse.json();
      setGoogleSheetUrl(spreadsheet.spreadsheetUrl);
      for (let offset = 0; offset < values.length; offset += 500) {
        const writeResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheet.spreadsheetId)}/values/Records!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ majorDimension: 'ROWS', values: values.slice(offset, offset + 500) }),
          },
        );
        if (!writeResponse.ok) throw new Error('Google Sheets could not write all exported records. The spreadsheet link is available below.');
      }
      toast.success(`${rows.length.toLocaleString()} authorized ${module} records copied to Google Sheets.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar">
        <Brand />
        <Link to="/dashboard" className="records-back"><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <section className="records-content">
        <div className="records-heading">
          <div><span className="panel-kicker">DATA MANAGEMENT</span><h1>Import &amp; export</h1><p>Move approved CSV data in and out of your authorized record scope.</p></div>
          <button className="records-primary secondary" disabled={loading} onClick={loadHistory} type="button"><RefreshCw size={15} /> Refresh history</button>
        </div>
        {error && <div className="records-error" role="alert">{error}</div>}

        <section className="transfer-card">
          <div className="panel-title-row"><div><span className="panel-kicker">RECORD EXPORT</span><h2><ArrowDownToLine size={17} /> Download records</h2></div></div>
          <p>Exports are generated from the server-enforced records visible to your account. Each export is limited to 5,000 rows.</p>
          <div className="transfer-actions">
            {exportModules.map((module) => <div className="export-module-actions" key={module}>
              <button className="records-primary secondary" onClick={() => exportModule(module)} type="button"><ArrowDownToLine size={15} /> Export {module} CSV</button>
              <button className="records-primary secondary" disabled={!googleClientId()} onClick={() => exportToGoogleSheets(module)} type="button">Export {module} to Sheets</button>
            </div>)}
          </div>
          {!googleClientId() && <p className="records-form-hint">Google Sheets export requires VITE_GOOGLE_CLIENT_ID and the Google Sheets API enabled in your project.</p>}
          {googleSheetUrl && <a className="records-text-button" href={googleSheetUrl} rel="noreferrer" target="_blank">Open the created Google Sheet</a>}
        </section>

        <section className="transfer-card">
          <div className="panel-title-row"><div><span className="panel-kicker">DATA IMPORT</span><h2><FileUp size={17} /> Import agricultural records</h2></div></div>
          <p>Use the exact downloaded module template. Rows are validated independently; valid rows are imported while invalid rows are listed for correction. Each import is limited to 500 rows and 2 MB.</p>
          <div className="transfer-actions">
            <button className="records-primary secondary" onClick={() => downloadTemplate(importModule)} type="button"><ArrowDownToLine size={15} /> Download {importModule} template</button>
            <form className="transfer-upload" onSubmit={importFarmers}>
              <label>Record type<select onChange={(event) => { setImportModule(event.target.value); setFile(null); setImportResult(null); }} value={importModule}>{Object.keys(importSchemas).map((module) => <option key={module} value={module}>{module}</option>)}</select></label>
              <label>CSV or XLSX file<input accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] || null); setImportResult(null); }} required type="file" /></label>
              <button className="records-primary" disabled={saving || !file} type="submit">{saving ? 'Importing…' : `Import ${importModule} rows`}</button>
            </form>
          </div>
          {importModule === 'farmers' && <div className="transfer-reference">
            <strong>Barangay IDs</strong>
            <p>Enter the ID assigned to an active, verified barangay; personnel can leave it blank because the server assigns their own barangay.</p>
            <ul>{barangays.map((barangay) => <li key={barangay.id}><code>{barangay.id}</code> {barangay.name}{Number(barangay.is_sample) === 1 ? ' (sample — cannot be imported)' : ''}</li>)}</ul>
          </div>}
          {importModule !== 'farmers' && <p className="records-form-hint">
            {importModule === 'farms' && 'Match each farmer by registry number. Leave both coordinates empty or provide both; optional area must be positive.'}
            {importModule === 'harvests' && 'Match each farmer by registry number and farm by its exact name. Optional planting and production IDs must belong to that same farm.'}
            {importModule === 'livestock' && 'Match each farmer by registry number and category by its exact configured name. Farm name is optional.'}
          </p>}
          <p className="records-note"><ShieldCheck size={14} /> XLSX files use the first worksheet and the exact downloaded headers. The backend enforces role and barangay scope and validates each row. Import logs store counts and row errors; files are not retained.</p>
        </section>

        {importResult && <section className="transfer-card" aria-live="polite">
          <h2>Import result</h2>
          <p>{importResult.importedRows} of {importResult.totalRows} rows imported; {importResult.errorCount} errors. Import ID: {importResult.importId}.</p>
          {importResult.errors.length > 0 && <ul className="transfer-errors">{importResult.errors.map((item) => <li key={`${item.line}-${item.message}`}>Line {item.line}: {item.message}</li>)}</ul>}
        </section>}

        <section className="transfer-card">
          <div className="panel-title-row"><div><span className="panel-kicker">AUDIT TRAIL</span><h2>Recent import history</h2></div><span className="activity-count">{history.length}</span></div>
          <div className="records-table-wrap"><table className="records-table">
            <thead><tr><th>File</th><th>Module</th><th>Barangay</th><th>By</th><th>Imported</th><th>Errors</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{loading ? <tr><td className="records-empty" colSpan="8">Loading import history…</td></tr>
              : history.length ? history.map((item) => <tr key={item.id}><td>{item.original_filename}</td><td>{item.module}</td><td>{item.barangay_name || 'City-wide'}</td><td>{item.imported_by}</td><td>{Number(item.imported_rows).toLocaleString()} / {Number(item.total_rows).toLocaleString()}</td><td>{Number(item.error_count).toLocaleString()}{Number(item.error_count) > 0 && <details><summary>View errors</summary><ul className="transfer-errors">{importErrors(item.error_report).map((rowError) => <li key={`${rowError.line}-${rowError.message}`}>Line {rowError.line}: {rowError.message}</li>)}</ul></details>}</td><td>{item.status}</td><td>{new Date(item.created_at.replace(' ', 'T')).toLocaleString()}</td></tr>)
                : <tr><td className="records-empty" colSpan="8">No CSV imports have been recorded.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </section>
    </main>
  );
}
