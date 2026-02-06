import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { StatusHeader } from '../components/StatusHeader';
import { GarmentConfig } from '../types';
import { uploadGarmentStandards } from '../services/qcService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface SettingsViewProps {
  timeStr: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ timeStr }) => {
    const [garmentConfig, setGarmentConfig] = useState<GarmentConfig | null>(null);
    const [selectedType, setSelectedType] = useState('trousers');
    const [unit, setUnit] = useState('cm');
    // const [templateText, setTemplateText] = useState('Loading...');
    const [file, setFile] = useState<File | null>(null);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<string[][]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [styleCode, setStyleCode] = useState('');

    useEffect(() => {
        fetch(`${API_BASE}/api/config`)
            .then(r => r.json())
            .then(data => {
                setGarmentConfig(data);
            })
            .catch(err => console.error('Error loading config', err));
    }, []);

    const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStyleCode(e.target.value);
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
        if (!styleCode.trim()) {
            alert("Please enter a Style Code.");
            return;
        }
        if (previewData.length === 0 || previewHeaders.length === 0) {
            alert("No valid data to upload. Please ensure rows are checked (TRUE in first column).");
            return;
        }

        setIsUploading(true);
        try {
            const sizeIndices = previewHeaders.map((h, i) => i >= 5 ? i : -1).filter(i => i !== -1);
            
            const standardsBySize: Record<string, any[]> = {};

            sizeIndices.forEach(colIdx => {
                const sizeLabel = previewHeaders[colIdx];
                const measurements: any[] = [];

                
                previewData.forEach(row => {
                     const checkVal = row[0] ? row[0].toString().trim().toUpperCase() : '';
                     if (checkVal === 'TRUE' || checkVal === '1') {
                         measurements.push({
                             pom_code: row[1],
                             description: row[2],
                             tol_minus: row[3],
                             tol_plus: row[4],
                             value: row[colIdx] || ''
                         });
                     }
                });

                if (measurements.length > 0) {
                    standardsBySize[sizeLabel] = measurements;
                }
            });

            await uploadGarmentStandards(selectedType, styleCode.trim(), standardsBySize, unit); 

            alert(`Standards uploaded successfully for Style: '${styleCode}'!`);
            
            setFile(null);
            setPreviewHeaders([]);
            setPreviewData([]);
            setStyleCode('');
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
                            Upload a CSV file. Only checked rows (TRUE/1) will be imported. <br/>
                            You MUST provide a unique <strong>Style Code</strong> for this standard.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Select Garment Type</label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="w-full bg-black border border-cyber-gray text-white rounded-lg h-[46px] focus:ring-cyber-blue focus:ring-1 focus:ring-offset-0">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-cyber-gray text-white">
                                        {GARMENT_TYPES.map((g) => (
                                            <SelectItem 
                                                key={g.id} 
                                                value={g.id}
                                                className="focus:bg-cyber-blue focus:text-white cursor-pointer"
                                            >
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Measurement Unit</label>
                                <Select value={unit} onValueChange={setUnit}>
                                    <SelectTrigger className="w-full bg-black border border-cyber-gray text-white rounded-lg h-[46px] focus:ring-cyber-blue focus:ring-1 focus:ring-offset-0">
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-cyber-gray text-white">
                                        <SelectItem value="cm" className="focus:bg-cyber-blue focus:text-white cursor-pointer">CM</SelectItem>
                                        <SelectItem value="inch" className="focus:bg-cyber-blue focus:text-white cursor-pointer">INCH</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Style Code (Unique)</label>
                                <input 
                                    type="text"
                                    value={styleCode}
                                    onChange={handleStyleChange}
                                    placeholder="e.g. ST-2024-001"
                                    className="w-full bg-black border border-cyber-gray text-white rounded-lg p-3 focus:border-cyber-blue outline-none transition-colors"
                                />
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