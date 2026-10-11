import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ShareButton({ product, className = '' }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  if (!product) return null;

  // Construct valid public listing URL without internal or sensitive parameters
  const publicUrl = `${window.location.origin}/plants?id=${encodeURIComponent(product.id || '')}`;
  const title = `Check out ${product.name} on AgriPickup!`;
  const text = `Look at ${product.name}${product.price ? ` available for ₹${product.price}/${product.unit || 'plant'}` : ''} at ${product.nursery?.name || 'verified nursery'} on AgriPickup! Reserve fresh saplings now:`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text}\n${publicUrl}`,
          url: publicUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // If share rejected or failed, toggle fallback menu
          setOpenMenu(true);
        }
      }
    } else {
      setOpenMenu((prev) => !prev);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpenMenu(false);
      }, 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${publicUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setOpenMenu(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-700 shadow-sm border border-slate-200 backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
        title={t('share', 'Share')}
        aria-label={`Share ${product.name}`}
      >
        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">{t('share', 'Share')}</span>
      </button>

      {/* Share Fallback Menu */}
      {openMenu && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-bold text-slate-500 uppercase px-2.5 py-1">
            {t('share', 'Share')}
          </div>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-slate-700 text-xs font-medium flex items-center gap-2 transition-colors text-left"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{t('shareViaWhatsApp', 'Share via WhatsApp')}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2 transition-colors text-left"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-emerald-700 font-bold">{t('linkCopied', 'Link copied!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>{t('copyLink', 'Copy Link')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
