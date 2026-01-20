import React, { useState, useMemo } from 'react';
import { VariationResult, Mode } from '../types';
import { PAGE_SIZE } from '../constants';
import { Copy, Check, Star, Search, ChevronLeft, ChevronRight, Download, Trash2, Heart } from 'lucide-react';

interface VariationListProps {
  variations: VariationResult[];
  mode: Mode;
  toggleFavorite: (email: string) => void;
  favorites: Set<string>;
  onClearFavorites: () => void;
}

export const VariationList: React.FC<VariationListProps> = ({ 
  variations, 
  mode, 
  toggleFavorite, 
  favorites,
  onClearFavorites 
}) => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [variations]);

  const filteredVariations = useMemo(() => {
    if (!filter) return variations;
    return variations.filter(v => v.email.toLowerCase().includes(filter.toLowerCase()));
  }, [variations, filter]);

  const totalPages = Math.ceil(filteredVariations.length / PAGE_SIZE);
  const isPaginated = mode === Mode.DOT || filteredVariations.length > 1000;

  const displayedVariations = isPaginated
    ? filteredVariations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filteredVariations;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyVisible = () => {
    const text = displayedVariations.map(v => v.email).join('\n');
    navigator.clipboard.writeText(text);
    alert(`Copied ${displayedVariations.length} variations to clipboard!`);
  };

  const handleCopyFavorites = () => {
    if (favorites.size === 0) {
      alert("No favorites selected!");
      return;
    }
    const text = Array.from(favorites).join('\n');
    navigator.clipboard.writeText(text);
    alert(`Copied ${favorites.size} favorites to clipboard!`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col h-[600px] transition-colors">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        {/* Top Row: Search and Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search results..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
             <span>Total: <strong className="text-gray-900 dark:text-white">{filteredVariations.length.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
           <button 
             onClick={handleCopyVisible}
             className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
           >
             <Copy size={14} /> Copy Visible
           </button>
           
           <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

           <button 
             onClick={handleCopyFavorites}
             disabled={favorites.size === 0}
             className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
               favorites.size > 0 
                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40' 
                : 'text-gray-400 cursor-not-allowed'
             }`}
           >
             <Heart size={14} fill={favorites.size > 0 ? "currentColor" : "none"} /> 
             Copy Favs ({favorites.size})
           </button>

           <button 
             onClick={onClearFavorites}
             disabled={favorites.size === 0}
             className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
               favorites.size > 0 
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                : 'text-gray-400 cursor-not-allowed'
             }`}
           >
             <Trash2 size={14} /> Clear Favs
           </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
        {displayedVariations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p>No variations found matching your filter.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayedVariations.map((v) => (
              <div 
                key={v.email} 
                className={`group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${v.isFavorite ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleFavorite(v.email)}
                      className={`p-1 rounded-full transition-colors ${v.isFavorite ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
                    >
                      <Star size={16} fill={v.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate font-mono">
                      {v.email}
                    </span>
                  </div>
                  {v.sourceEmail && (
                    <span className="text-xs text-gray-400 italic hidden sm:inline-block">
                      from {v.sourceEmail}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleCopy(v.email)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    copiedEmail === v.email 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {copiedEmail === v.email ? <Check size={12} /> : <Copy size={12} />}
                  {copiedEmail === v.email ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {isPaginated && totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
