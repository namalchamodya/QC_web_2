import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { StatusHeader } from '../components/StatusHeader';
import { GarmentConfig } from '../types';
import { uploadGarmentStandards } from '../services/qcService';

interface SettingsViewProps {
  timeStr: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ timeStr }) => {
    const [garmentConfig, setGarmentConfig] = useState<GarmentConfig | null>(null);
    const [selectedType, setSelectedType] = useState('trousers');
    // const [templateText, setTemplateText] = useState('Loading...');
    const [file, setFile] = useState<File | null>(null);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<string[][]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/api/config`)
            .then(r => r.json())
            .then(data => {
                setGarmentConfig(data);
            })
            .catch(err => console.error('Error loading config', err));
    }, []);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setFile(selectedFile);
        setPreviewHeaders([]);
        setPreviewData([]);

        if (selectedFile) {
            Papa.parse(selectedFile, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = results.data as string[][];
                    if (rows.length > 0) {
                        const headers = rows[0]; 
                        setPreviewHeaders(headers);

                        const filteredRows = rows.slice(1).filter(row => {
                            const checkVal = row[0] ? row[0].toString().trim().toUpperCase() : '';
                            return checkVal === 'TRUE' || checkVal === '1';
                        });
                        setPreviewData(filteredRows);
                    }
                },
                error: (err: any) => {
                    console.error("CSV Parse Error:", err);
                    alert("Error parsing CSV file.");
                }
            });
        }
    };

    const handleUploadToDB = async () => {
        if (!file) return;
        if (previewData.length === 0 || previewHeaders.length === 0) {
            alert("No valid data to upload. Please ensure rows are checked (TRUE in first column).");
            return;
        }

        setIsUploading(true);
        try {
            const fileNameNoExt = file.name.replace(/\.[^/.]+$/, "");
            const standardId = `${selectedType}-${fileNameNoExt}`;

            const sizeLabels = previewHeaders.slice(5); 
            
            const standards = previewData.map(row => {
                const sizes: Record<string, string> = {};
                sizeLabels.forEach((label, idx) => {
                    sizes[label] = row[5 + idx] || '';
                });

                return {
                    pom_code: row[1],
                    description: row[2],
                    tol_minus: row[3],
                    tol_plus: row[4],
                    sizes: sizes
                };
            });

            await uploadGarmentStandards(standardId, standards);
            alert(`Standards uploaded successfully as '${standardId}'!`);
            
        
            setFile(null);
            setPreviewHeaders([]);
            setPreviewData([]);
            const fileInput = document.getElementById('csvInput') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

        } catch (error) {
            console.error(error);
            alert("Failed to upload standards to database.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-cyber-black text-cyber-text">
            <div className="flex-none p-6 pb-2 border-b border-gray-900/50 bg-cyber-black z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h2 className="text-2xl font-bold uppercase tracking-wider text-white">System Settings</h2>
                    <StatusHeader statusText="Settings" timeStr={timeStr} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Import Size Standards (CSV)</h3>
                        <p className="text-gray-400 mb-6 text-sm">
                            Upload a CSV file. Only checked rows (TRUE/1) will be imported. 
                            Calculations will use the composite ID: <code>[Type]-[Filename]</code>.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Select Garment Type</label>
                                <select 
                                    value={selectedType} 
                                    onChange={handleTypeChange}
                                    className="w-full bg-black border border-cyber-gray text-white rounded-lg p-3 focus:border-cyber-blue outline-none transition-colors"
                                >
                                    {GARMENT_TYPES.map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center bg-black/30 p-4 rounded-xl border border-dashed border-gray-700 mb-8">
                            <input 
                                id="csvInput"
                                type="file" 
                                accept=".csv"
                                onChange={handleFileChange}
                                className="flex-1 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyber-blue file:text-white hover:file:bg-blue-600"
                            />
                        </div>

                        {previewData.length > 0 && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-white font-bold">Preview ({previewData.length} valid rows)</h4>
                                </div>
                                <div className="max-h-96 overflow-auto bg-black border border-cyber-gray rounded-lg custom-scrollbar">
                                    <table className="w-full text-xs text-left text-gray-300 relative border-collapse">
                                        <thead className="bg-gray-800 text-gray-400 uppercase sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                {previewHeaders.map((h, i) => (
                                                    <th key={i} className="px-4 py-3 border-b border-gray-700 whitespace-nowrap bg-gray-800 font-semibold tracking-wider">
                                                        {h || `Col ${i}`}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                                                    {row.map((cell, cIdx) => (
                                                        <td key={cIdx} className="px-4 py-2 whitespace-nowrap border-r border-gray-800 last:border-r-0">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-800">
                            <button 
                                onClick={handleUploadToDB}
                                disabled={!file || previewData.length === 0 || isUploading}
                                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors uppercase text-sm tracking-wider flex items-center gap-2 shadow-lg shadow-green-900/20 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {isUploading ? 'Uploading...' : 'Save to Database'}
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};