import React from 'react';
import { HistoryItem } from '../types';
import { Clock, RotateCcw, Trash2, X, Download } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onRestore, 
  onClear, 
  onDelete,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleExportHistory = () => {
    if (history.length === 0) return;
    
    const headers = ['Timestamp', 'Input', 'Mode', 'Count', 'IsBatch'].join(',');
    const rows = history.map(item => {
      const date = new Date(item.timestamp).toISOString();
      const inputSafe = item.input.replace(/[\n,]/g, ' '); // simple escape
      return `${date},"${inputSafe}",${item.mode},${item.count},${item.isBatch}`;
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gv-history-log-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={20} /> History
        </h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <p>No history yet.</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group relative"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  item.mode === 'DOT' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {item.mode} {item.isBatch ? '(BATCH)' : ''}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-1" title={item.input}>
                {item.input}
              </p>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{item.count.toLocaleString()} variants</span>
                <div className="flex gap-2">
                   <button 
                    onClick={() => onRestore(item)}
                    className="p-1.5 rounded-full bg-white dark:bg-gray-600 text-primary-600 hover:text-primary-700 shadow-sm"
                    title="Restore this session"
                   >
                     <RotateCcw size={14} />
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1.5 rounded-full bg-white dark:bg-gray-600 text-red-400 hover:text-red-500 shadow-sm"
                    title="Delete item"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-2">
          <button 
            onClick={handleExportHistory}
            className="w-full py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export History Log
          </button>
          <button 
            onClick={onClear}
            className="w-full py-2 px-4 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Clear All History
          </button>
        </div>
      )}
    </div>
  );
};