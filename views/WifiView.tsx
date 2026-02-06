import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';
import { StatusHeader } from '../components/StatusHeader';

interface WifiNetwork {
    ssid: string;
    signal: number;
    secure: boolean;
}

interface WifiViewProps {
    timeStr: string;
    onBack: () => void;
}

export const WifiView: React.FC<WifiViewProps> = ({ timeStr, onBack }) => {
    const [networks, setNetworks] = useState<WifiNetwork[]>([]);
    const [currentSSID, setCurrentSSID] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('Ready');
    const [wifiEnabled, setWifiEnabled] = useState(true); // Track adapter state
    
    // Connection Modal State
    const [selectedSSID, setSelectedSSID] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const scanNetworks = async () => {
        setLoading(true);
        setStatusMsg('Scanning...');
        try {
            const res = await fetch(`${API_BASE}/api/wifi/scan`);
            const data = await res.json();
            
            // If data comes back empty, it might mean adapter is off or just no results
            setNetworks(data.networks || []);
            
            if (data.current) {
                if (data.current.connected) {
                    setCurrentSSID(data.current.ssid);
                } else {
                    setCurrentSSID('');
                }
            }
        } catch (e) {
            console.error(e);
            setStatusMsg('Scan Failed');
        } finally {
            setLoading(false);
            if (!isConnecting) setStatusMsg('Ready');
        }
    };

    useEffect(() => {
        scanNetworks();
        // Poll every 10 seconds to keep list fresh
        const timer = setInterval(scanNetworks, 10000);
        return () => clearInterval(timer);
    }, []);

    const handleToggleWifi = async () => {
        const newState = !wifiEnabled;
        setStatusMsg(newState ? "Enabling Wi-Fi..." : "Disabling Wi-Fi...");
        
        try {
            await fetch(`${API_BASE}/api/wifi/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: newState })
            });
            
            setWifiEnabled(newState);
            
            if (newState) {
                // If turning ON, wait 4 seconds then scan to get fresh results
                setTimeout(() => {
                    scanNetworks();
                }, 4000);
            } else {
                setNetworks([]);
                setCurrentSSID('');
            }

        } catch (e) {
            alert("Failed to toggle Wi-Fi. Ensure App is running as Administrator.");
        }
    };

    const handleConnect = async () => {
        if (!selectedSSID) return;
        setIsConnecting(true);
        setStatusMsg(`Connecting to ${selectedSSID}...`);

        try {
            const res = await fetch(`${API_BASE}/api/wifi/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ssid: selectedSSID, password: password })
            });
            const result = await res.json();
            
            if (result.success) {
                alert("Connected Successfully!");
                setCurrentSSID(selectedSSID);
                setSelectedSSID(null);
                setPassword('');
            } else {
                alert("Connection Failed: " + result.message);
            }
        } catch (e) {
            alert("Error sending connection request");
        } finally {
            setIsConnecting(false);
            setStatusMsg('Ready');
            scanNetworks(); 
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-cyber-black text-cyber-text">
            {/* Header */}
            <div className="flex-none p-6 pb-2 border-b border-gray-900/50 bg-cyber-black z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        {/* NO BACK BUTTON HERE */}
                        <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Wi-Fi Configuration</h2>
                        
                        {/* POWER TOGGLE BUTTON */}
                        <button 
                            onClick={handleToggleWifi}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                                wifiEnabled 
                                ? 'bg-green-900/30 border-green-500 text-green-400 hover:bg-green-900/50' 
                                : 'bg-red-900/30 border-red-500 text-red-400 hover:bg-red-900/50'
                            }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${wifiEnabled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                            <span className="text-sm font-bold tracking-wide uppercase">
                                {wifiEnabled ? "Adapter ON" : "Adapter OFF"}
                            </span>
                        </button>
                    </div>
                    <StatusHeader statusText={statusMsg} timeStr={timeStr} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Current Connection Card */}
                    <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-6 mb-8 shadow-lg shadow-blue-900/10">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Current Connection</h3>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${currentSSID ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                                <span className="text-2xl font-bold text-white">
                                    {currentSSID || "Not Connected"}
                                </span>
                            </div>
                            <button 
                                onClick={scanNetworks}
                                disabled={loading || !wifiEnabled}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all border border-gray-600 uppercase tracking-wide disabled:opacity-50"
                            >
                                {loading ? 'Scanning...' : 'Refresh List'}
                            </button>
                        </div>
                    </div>

                    {/* Available Networks List */}
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4 px-2">Available Networks</h3>
                    <div className="grid gap-3">
                        {networks.map((net, idx) => (
                            <div 
                                key={`${net.ssid}-${idx}`}
                                onClick={() => { if(wifiEnabled) setSelectedSSID(net.ssid); }}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group
                                    ${currentSSID === net.ssid 
                                        ? 'bg-blue-900/20 border-cyber-blue' 
                                        : 'bg-black/40 border-gray-800 hover:border-gray-600 hover:bg-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <SignalIcon strength={net.signal} />
                                    <span className="font-medium text-lg text-gray-200 group-hover:text-white transition-colors">
                                        {net.ssid}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-500">{net.signal}%</span>
                                    {net.ssid === currentSSID && (
                                        <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded font-bold uppercase tracking-wider">Connected</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {networks.length === 0 && !loading && (
                            <div className="text-center p-8 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                {wifiEnabled ? "No networks found." : "Wi-Fi Adapter is turned OFF."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {selectedSSID && selectedSSID !== currentSSID && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-cyber-dark border border-cyber-gray p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        {/* Close Button (X) */}
                        <button 
                            onClick={() => { setSelectedSSID(null); setPassword(''); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-white mb-1">Connect to Wi-Fi</h3>
                        <p className="text-cyber-blue mb-6 font-mono text-sm">{selectedSSID}</p>
                        
                        <label className="block text-xs text-gray-500 uppercase mb-2 tracking-wider">Password</label>
                        <input 
                            type="password" 
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleConnect(); }}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyber-blue outline-none mb-6 transition-colors"
                            placeholder="Enter network key..."
                        />
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => { setSelectedSSID(null); setPassword(''); }}
                                className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors uppercase text-sm font-bold tracking-wide"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="flex-1 py-3 rounded-lg bg-cyber-blue text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 uppercase text-sm tracking-wide shadow-lg shadow-blue-900/20"
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Signal Strength Indicator Component
const SignalIcon = ({ strength }: { strength: number }) => {
    let bars = 1;
    if (strength > 40) bars = 2;
    if (strength > 60) bars = 3;
    if (strength > 80) bars = 4;

    return (
        <div className="flex items-end gap-[2px] h-4 w-5 opacity-80">
            {[1, 2, 3, 4].map(i => (
                <div 
                    key={i} 
                    className={`w-[3px] rounded-[1px] ${i <= bars ? 'bg-cyber-blue shadow-[0_0_5px_#00f0ff]' : 'bg-gray-800'}`}
                    style={{ height: `${i * 25}%` }}
                />
            ))}
        </div>
    );
};