import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-300">
        Built by <span className="font-semibold text-white">Simen Staaby Knudsen</span>. Connect on{' '}
        <a
          href="https://www.linkedin.com/in/simen-staaby-knudsen-6715691b2/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          LinkedIn
        </a>
        .
      </div>
    </footer>
  );
}
