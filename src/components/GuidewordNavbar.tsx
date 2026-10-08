import React, { useState } from 'react';
import { HelpCircle, Share2, Check, ExternalLink } from 'lucide-react';
import { GuidewordHelpModal } from './GuidewordHelpModal';

interface GuidewordNavbarProps {
  onShowToast: (msg: string) => void;
}

export const GuidewordNavbar: React.FC<GuidewordNavbarProps> = ({ onShowToast }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    onShowToast('워크스페이스 공유 링크가 클립보드에 복사되었습니다.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-5 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#1c4a34] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-xs">
            gw
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">guideword</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">고객언어 검수 워크스페이스</span>
            </div>
          </div>
        </div>

        {/* Right: Status and Utilities */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-xs text-slate-600 font-medium">
          {/* Status pill: 유료 API 없이 */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 text-emerald-800 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-[11.5px]">유료 API 없이 온디바이스</span>
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">사용 안내</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all cursor-pointer shadow-2xs"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>팀과 공유</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Help Modal */}
      <GuidewordHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
