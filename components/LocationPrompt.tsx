import React from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationPromptProps {
    onDismiss: () => void;
    onRequest: () => void;
}

const LocationPrompt: React.FC<LocationPromptProps> = ({ onDismiss, onRequest }) => {
    return (
        <div className="fixed bottom-14 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-blue-900/90 backdrop-blur-md border border-blue-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-3 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />

                <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0 font-sans">
                    <h4 className="text-white font-bold text-sm mb-1">Enable Local Intelligence</h4>
                    <p className="text-blue-200 text-xs leading-relaxed mb-3">
                        Activate location services to detect events in your immediate sector (&lt; 1000km).
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={onRequest}
                            className="px-3 py-1.5 bg-white text-blue-900 text-xs font-black uppercase tracking-wider rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Activate
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1.5 bg-transparent border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-blue-800/50 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>

                <button
                    onClick={onDismiss}
                    className="text-blue-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default LocationPrompt;
