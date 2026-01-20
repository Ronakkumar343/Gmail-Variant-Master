import React, { useState, useEffect, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { VariationList } from './components/VariationList';
import { StatsPanel } from './components/StatsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { Mode, Separator, VariationResult, HistoryItem } from './types';
import { MOCK_TAGS } from './constants';
import { generateDotVariationsAsync, generatePlusVariations } from './services/generatorService';
import { Moon, Sun, Download, Trash2, Github, Clock, Heart, Linkedin } from 'lucide-react';

const saveAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // Input States
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>(Mode.DOT);
  const [tags, setTags] = useState(MOCK_TAGS);
  const [separator, setSeparator] = useState<Separator>(Separator.PLUS);
  const [isBatch, setIsBatch] = useState(false);

  // Data States
  const [variations, setVariations] = useState<VariationResult[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Initialization
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    const savedHistory = localStorage.getItem('gv_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error('Failed to load history'); }
    }
    const savedFavs = localStorage.getItem('gv_favorites');
    if (savedFavs) {
       try {
         setFavorites(new Set(JSON.parse(savedFavs)));
       } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist History & Favorites
  useEffect(() => {
    localStorage.setItem('gv_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('gv_favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const addToHistory = (resultCount: number) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input: email,
      mode,
      tags: mode === Mode.PLUS ? tags : undefined,
      separator: mode === Mode.PLUS ? separator : undefined,
      count: resultCount,
      isBatch
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setVariations([]); // Clear previous results immediately

    const inputEmails = isBatch 
      ? email.split(/[\n,]+/).map(e => e.trim()).filter(e => e)
      : [email.trim()];
    
    const totalEmails = inputEmails.length;
    if (totalEmails === 0) {
      setIsGenerating(false);
      return;
    }

    try {
      let allResults: VariationResult[] = [];

      if (mode === Mode.DOT) {
        for (let i = 0; i < totalEmails; i++) {
           const currentEmail = inputEmails[i];
           // Approximate progress per email
           const baseProgress = (i / totalEmails) * 100;
           
           // Use async generator for dot mode to update UI
           const generator = generateDotVariationsAsync(currentEmail);
           
           for await (const chunk of generator) {
             allResults = [...allResults, ...chunk];
             // Simple progress estimation: just pulse or update based on email count
             setProgress(baseProgress + 5); // Rough indicator within email processing
           }
           
           setProgress(((i + 1) / totalEmails) * 100);
        }
      } else {
        // Plus mode is fast enough to do synchronously usually, 
        // but let's loop to update progress bar if batch is huge
        for (let i = 0; i < totalEmails; i++) {
          const res = generatePlusVariations(inputEmails[i], tags, separator);
          allResults = [...allResults, ...res];
          setProgress(((i + 1) / totalEmails) * 100);
          await new Promise(r => setTimeout(r, 0)); // Yield to UI
        }
      }

      // Re-apply favorites state
      const mappedResults = allResults.map(r => ({
        ...r,
        isFavorite: favorites.has(r.email)
      }));

      setVariations(mappedResults);
      addToHistory(mappedResults.length);
      
    } catch (e) {
      alert("Error generating variations. Please check inputs.");
      console.error(e);
    } finally {
      setProgress(100);
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const restoreHistory = (item: HistoryItem) => {
    setEmail(item.input);
    setMode(item.mode);
    setIsBatch(item.isBatch);
    if (item.tags) setTags(item.tags);
    if (item.separator) setSeparator(item.separator);
    setShowHistory(false);
    // Optionally auto-generate? No, let user review.
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const toggleFavorite = (email: string) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(email)) {
      newFavs.delete(email);
    } else {
      newFavs.add(email);
    }
    setFavorites(newFavs);
    
    setVariations(prev => prev.map(v => 
      v.email === email ? { ...v, isFavorite: !v.isFavorite } : v
    ));
  };

  const handleExport = (format: 'csv' | 'txt' | 'json', onlyFavorites = false) => {
    let data: string[] = [];

    if (onlyFavorites) {
      // Export ALL favorites from state, not just visible ones
      data = Array.from(favorites);
    } else {
      // Export currently generated variations
      data = variations.map(v => v.email);
    }
      
    if (data.length === 0) {
      alert(onlyFavorites ? "No favorites saved." : "No variations generated to export.");
      return;
    }
    
    let content = "";
    const filename = `gmail-variations${onlyFavorites ? '-favs' : ''}-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
    } else if (format === 'csv') {
      content = "Email\n" + data.join("\n");
      const blob = new Blob([content], { type: 'text/csv' });
      saveAs(blob, `${filename}.csv`);
    } else {
      content = data.join("\n");
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, `${filename}.txt`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col overflow-x-hidden">
      
      <HistoryPanel 
        history={history}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={restoreHistory}
        onDelete={deleteHistoryItem}
        onClear={() => setHistory([])}
      />

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                 <span className="text-white font-bold text-xl leading-none">G</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
                Variant<span className="text-primary-600">Master</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                title="History"
              >
                <Clock size={20} />
              </button>
              <a href="https://github.com/Ronakkumar343" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Master Your Gmail Aliases
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Generate thousands of valid email variations using the dot-insertion trick or plus-tagging. 
            Perfect for tracking subscriptions, filtering spam, and testing.
          </p>
        </div>

        <InputForm
          email={email}
          setEmail={setEmail}
          mode={mode}
          setMode={setMode}
          tags={tags}
          setTags={setTags}
          separator={separator}
          setSeparator={setSeparator}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isBatch={isBatch}
          setIsBatch={setIsBatch}
          progress={progress}
        />

        {/* Results Section */}
        {variations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left: List */}
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generated Variations</h2>
                <div className="flex gap-2">
                  <div className="relative group">
                     <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Download size={16} /> Export All
                     </button>
                     <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block z-10">
                       <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">CSV</button>
                       <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">TXT</button>
                       <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">JSON</button>
                     </div>
                  </div>

                  <div className="relative group">
                     <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                        <Heart size={16} /> Export Favs
                     </button>
                     <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block z-10">
                       <button onClick={() => handleExport('csv', true)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">CSV</button>
                       <button onClick={() => handleExport('txt', true)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">TXT</button>
                       <button onClick={() => handleExport('json', true)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">JSON</button>
                     </div>
                  </div>
                </div>
              </div>
              <VariationList 
                variations={variations} 
                mode={mode}
                toggleFavorite={toggleFavorite}
                favorites={favorites}
                onClearFavorites={() => {
                  setFavorites(new Set());
                  setVariations(prev => prev.map(v => ({...v, isFavorite: false})));
                }}
              />
            </div>

            {/* Right: Stats & Info */}
            <div className="lg:col-span-1 space-y-6">
               <StatsPanel variations={variations} originalEmail={isBatch ? 'Batch' : email} />
               
               <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
                 <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Did you know?</h3>
                 <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                   Gmail ignores dots in your username. <strong>john.doe@gmail.com</strong> is the same as <strong>johndoe@gmail.com</strong>.
                   Use these aliases to detect which service sold your data by assigning a unique dot pattern to each newsletter.
                 </p>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-4">
          <a href="https://ibb.co/8g1cTCWs" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img 
              src="https://i.ibb.co/60jBVM3w/ronak.png" 
              alt="ronak" 
              className="h-16 w-16 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800 shadow-md" 
            />
          </a>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-1.5">
              Made with <Heart size={16} className="text-red-500 fill-current animate-pulse" /> by <span className="font-bold text-gray-900 dark:text-white">RONAKLANGHANI</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/Ronakkumar343" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors transform hover:scale-110 duration-200"
              title="GitHub"
            >
              <Github size={24} />
            </a>
            <a 
              href="https://www.linkedin.com/in/ronak-langhani-5862a3380" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors transform hover:scale-110 duration-200"
              title="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;