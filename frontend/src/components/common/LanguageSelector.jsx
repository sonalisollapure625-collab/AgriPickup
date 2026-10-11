import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition-colors">
      <Globe className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent border-none focus:outline-none cursor-pointer text-slate-800 font-medium"
        aria-label="Select Language"
      >
        <option value="en">English</option>
        <option value="kn">ಕನ್ನಡ (Kannada)</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </select>
    </div>
  );
}
