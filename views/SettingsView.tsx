import React, { useState, useEffect } from 'react';
import { API_BASE, GARMENT_TYPES } from '../constants';
import { StatusHeader } from '../components/StatusHeader';
import { GarmentConfig } from '../types';

interface SettingsViewProps {
  timeStr: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ timeStr }) => {
    const [garmentConfig, setGarmentConfig] = useState<GarmentConfig | null>(null);
    const [selectedType, setSelectedType] = useState('trousers');
    const [templateText, setTemplateText] = useState('Loading...');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/config`)
            .then(r => r.json())
            .then(data => {
                setGarmentConfig(data);
                updateTemplate(data, selectedType);
            })
            .catch(err => setTemplateText('Error loading config'));
    }, []);

    const updateTemplate = (config: GarmentConfig, type: string) => {
        if (config && config[type]) {
            const headers = ["Size", ...config[type].measurements];
            setTemplateText(headers.join(', '));
        } else {
            setTemplateText("No configuration found for this type.");
        }
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
        if (garmentConfig) updateTemplate(garmentConfig, e.target.value);
    };

    const handleImport = async () => {
        if (!file) {
            alert("Please select a CSV file first.");
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('garment_type', selectedType);

        try {
            await fetch(`${API_BASE}/api/import-size-csv`, { method: 'POST', body: fd });
            alert("CSV Imported Successfully");
            setFile(null);
            // Reset file input visually if needed
            const fileInput = document.getElementById('csvInput') as HTMLInputElement;
            if(fileInput) fileInput.value = '';
        } catch (e) {
            alert("Error importing CSV");
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto mt-8 h-full p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white">System Settings</h2>
                <StatusHeader statusText="Settings" timeStr={timeStr} />
            </div>

            <div className="bg-cyber-dark border border-cyber-gray rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-2">Import Size Standards (CSV)</h3>
                <p className="text-gray-400 mb-6 text-sm">
                    Upload a CSV file to update size specifications. Extra columns (e.g. "Comments", "Batch") will be ignored.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                    <div>
                         <label className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Required CSV Format</label>
                         <div className="bg-black border border-cyber-gray rounded-lg p-3 text-cyber-cyan font-mono text-xs overflow-x-auto whitespace-nowrap">
                             {templateText}
                         </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 items-center bg-black/30 p-4 rounded-xl border border-dashed border-gray-700">
                    <input 
                        id="csvInput"
                        type="file" 
                        accept=".csv"
                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                        className="flex-1 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyber-blue file:text-white hover:file:bg-blue-600"
                    />
                    <button 
                        onClick={handleImport}
                        disabled={!file}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors uppercase text-sm tracking-wider"
                    >
                        Upload CSV
                    </button>
                </div>
            </div>
        </div>
    );
};