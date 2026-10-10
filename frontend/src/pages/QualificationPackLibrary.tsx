import React, { useState, useEffect } from 'react';
import { qualApi } from '../services/api';
import { BookOpen, Search, Upload, X, FileJson } from 'lucide-react';

export const QualificationPackLibrary: React.FC = () => {
  const [qps, setQps] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQpModal, setSelectedQpModal] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<any>(null);

  useEffect(() => {
    loadQps();
  }, [searchTerm, selectedSector, selectedLevel]);

  async function loadQps() {
    setLoading(true);
    try {
      const data = await qualApi.list({
        q: searchTerm || undefined,
        sector: selectedSector || undefined,
        level: selectedLevel ? parseInt(selectedLevel) : undefined
      });
      setQps(data);
    } catch (err) {
      console.error("Error loading QPs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleImportSubmit = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const result = await qualApi.importQps(arr);
      setImportFeedback(result);
      loadQps();
    } catch (err: any) {
      setImportFeedback({ errors: [`JSON Parse Error: ${err.message}`] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Official Qualification Pack Library</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            MSDE NCVET Official Qualification Register • Standards, Criteria & Scoring Rubrics
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow transition"
        >
          <Upload className="h-4 w-4 text-blue-400" />
          <span>Import Structured QP (JSON)</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job Role, QP ID (e.g. ELE/Q5901)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Sectors</option>
            <option value="Electronics">Electronics & Renewable Energy</option>
            <option value="Construction">Construction</option>
            <option value="Automotive">Automotive</option>
            <option value="IT-ITeS">IT-ITeS</option>
            <option value="Capital Goods">Capital Goods & Manufacturing</option>
          </select>
        </div>

        <div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All NSQF Levels</option>
            <option value="3">NSQF Level 3</option>
            <option value="4">NSQF Level 4</option>
            <option value="5">NSQF Level 5</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading Qualification Packs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qps.map((qp) => (
            <div key={qp.id || qp.qp_code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {qp.qp_code}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Level {qp.nsqf_level}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{qp.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{qp.sector}</p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{qp.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-400">Source: {qp.source}</span>
                <button
                  onClick={() => setSelectedQpModal(qp)}
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Criteria ({qp.competencies?.length || 0} NOS) →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedQpModal.qp_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedQpModal.title}</h3>
              </div>
              <button onClick={() => setSelectedQpModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {selectedQpModal.competencies?.map((comp: any) => (
                <div key={comp.nos_code} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    {comp.nos_code}: {comp.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">{comp.description}</p>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-bold text-slate-700 uppercase">Assessment Criteria:</p>
                    {comp.criteria?.map((crit: any) => (
                      <div key={crit.criterion_code} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">{crit.criterion_code}: </span>
                          <span className="text-slate-700">{crit.description}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {crit.is_mandatory && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Mandatory</span>
                          )}
                          {crit.is_safety_critical && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Safety Critical</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileJson className="h-5 w-5 text-blue-600" />
                <span>Import Official Qualification Pack (JSON)</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste structured Qualification Pack JSON data conforming to MSDE NCVET structure.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono"
              placeholder='[ { "qp_code": "ELE/Q5901", "title": "Solar Panel Tech", ... } ]'
            />

            {importFeedback && (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs">
                <p className="font-bold">Import Status Summary:</p>
                <p>Imported: {importFeedback.imported_count || 0} | Updated: {importFeedback.updated_count || 0}</p>
                {importFeedback.errors?.length > 0 && (
                  <p className="text-rose-600 font-semibold mt-1">Errors: {importFeedback.errors.join(', ')}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={handleImportSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow"
              >
                Validate & Import Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
