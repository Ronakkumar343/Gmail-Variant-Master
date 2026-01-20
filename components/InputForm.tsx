import React, { useState, useEffect } from 'react';
import { Mode, Separator } from '../types';
import { GMAIL_REGEX, MAX_USERNAME_LENGTH_FOR_DOTS, SEPARATOR_OPTIONS, MOCK_TAGS } from '../constants';
import { normalizeUsername } from '../services/generatorService';
import { AlertTriangle, Wand2, Mail, Tag, Settings2, Layers, Type } from 'lucide-react';

interface InputFormProps {
  email: string;
  setEmail: (val: string) => void;
  mode: Mode;
  setMode: (val: Mode) => void;
  tags: string;
  setTags: (val: string) => void;
  separator: Separator;
  setSeparator: (val: Separator) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isBatch: boolean;
  setIsBatch: (val: boolean) => void;
  progress: number;
}

export const InputForm: React.FC<InputFormProps> = ({
  email,
  setEmail,
  mode,
  setMode,
  tags,
  setTags,
  separator,
  setSeparator,
  onGenerate,
  isGenerating,
  isBatch,
  setIsBatch,
  progress
}) => {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Parse emails for batch mode to validate
  const getBatchEmails = () => email.split(/[\n,]+/).map(e => e.trim()).filter(e => e.length > 0);

  useEffect(() => {
    if (!email) {
      setError(null);
      setWarning(null);
      return;
    }

    if (isBatch) {
      const emails = getBatchEmails();
      if (emails.length === 0) {
        setError(null);
        return;
      }
      const invalid = emails.find(e => !GMAIL_REGEX.test(e));
      if (invalid) {
        setError(`Invalid email found: ${invalid}`);
      } else {
        setError(null);
      }
      
      // Batch dot warning
      if (mode === Mode.DOT) {
         const longEmail = emails.find(e => normalizeUsername(e).username.length > MAX_USERNAME_LENGTH_FOR_DOTS);
         if (longEmail) {
           setWarning("One or more emails are too long for safe dot generation.");
         } else {
           setWarning(null);
         }
      }
    } else {
      // Single Mode Validation
      if (!GMAIL_REGEX.test(email)) {
        setError("Please enter a valid Gmail address (e.g., user@gmail.com)");
        setWarning(null);
        return;
      }
      
      setError(null);

      if (mode === Mode.DOT) {
        const { username } = normalizeUsername(email);
        if (username.length > MAX_USERNAME_LENGTH_FOR_DOTS) {
          setWarning(`Username length (${username.length}) creates over ${Math.pow(2, username.length - 1).toLocaleString()} variations. This may crash the browser. We recommend shortening it.`);
        } else {
          setWarning(null);
        }
      } else {
        setWarning(null);
      }
    }
  }, [email, mode, isBatch]);

  const handleModeToggle = (newMode: Mode) => {
    setMode(newMode);
  };

  const isValid = !error && email.length > 0 && !(mode === Mode.DOT && warning && !isBatch && normalizeUsername(email).username.length > 18);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors relative overflow-hidden">
      
      {/* Progress Bar Overlay */}
      {isGenerating && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-500 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
               {isBatch ? 'Gmail Addresses (one per line)' : 'Gmail Address'}
             </label>
             <button
               onClick={() => setIsBatch(!isBatch)}
               className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                 isBatch 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
               }`}
             >
               <Layers size={12} />
               {isBatch ? 'Batch Mode ON' : 'Batch Mode OFF'}
             </button>
          </div>

          <div className="relative">
            {!isBatch && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            )}
            
            {isBatch ? (
              <textarea
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                rows={5}
                className={`block w-full p-3 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 transition-all font-mono text-sm`}
                placeholder={`user1@gmail.com\nuser2@gmail.com\n...`}
              />
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 transition-all`}
                placeholder="username@gmail.com"
              />
            )}
          </div>
          
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          {warning && (
             <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r-md">
               <div className="flex">
                 <div className="flex-shrink-0">
                   <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                 </div>
                 <div className="ml-3">
                   <p className="text-sm text-yellow-700 dark:text-yellow-200">
                     {warning}
                   </p>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Right Column: Mode & Config */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variation Mode
            </label>
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              <button
                onClick={() => handleModeToggle(Mode.DOT)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === Mode.DOT
                    ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                </div>
                Dot Variation
              </button>
              <button
                onClick={() => handleModeToggle(Mode.PLUS)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === Mode.PLUS
                    ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <Tag size={16} />
                Plus-Tag Variation
              </button>
            </div>
          </div>

          {mode === Mode.PLUS && (
            <div className="animate-fadeIn">
              <div className="flex gap-4 mb-4">
                 <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Separator
                    </label>
                    <div className="relative">
                      <select
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value as Separator)}
                        className="block w-full py-2 pl-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        {SEPARATOR_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <Settings2 className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma or newline separated)
              </label>
              <textarea
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                rows={3}
                className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="work, shopping, newsletter..."
              />
            </div>
          )}
          
          {mode === Mode.DOT && !isBatch && (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <p>Generates <strong>{normalizeUsername(email).username ? Math.pow(2, normalizeUsername(email).username.length - 1).toLocaleString() : 0}</strong> variations by inserting dots.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={!isValid || isGenerating}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium shadow-lg transition-all transform active:scale-95 ${
            !isValid || isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 hover:shadow-xl'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {Math.round(progress)}%
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Generate {isBatch ? 'Batch' : 'Variations'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
