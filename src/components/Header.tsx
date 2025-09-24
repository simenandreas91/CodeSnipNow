import React from 'react';
import { Code, User, LogOut, Plus } from 'lucide-react';
import type { User as UserType } from '../types/snippet';

interface HeaderProps {
  user: UserType | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onCreateSnippet: () => void;
}

export function Header({ user, onSignIn, onSignOut, onCreateSnippet }: HeaderProps) {
  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="CodeSnipNow Logo" className="h-12 w-12" />
          <span className="text-xl font-semibold text-white">CodeSnipNow</span>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={onCreateSnippet}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="h-4 w-4" />
                Create Snippet
              </button>
              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="px-4 py-2 bg-gradient-to-r from-slate-700 to-blue-600 text-white rounded-lg hover:from-slate-800 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
