import { useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { SnippetGrid } from './components/SnippetGrid';
import { IntegrationsGrid } from './components/IntegrationsGrid';
import { SnippetModal } from './components/SnippetModal';
import { Pagination } from './components/Pagination';
import { AuthModal } from './components/AuthModal';
import { CreateSnippetModal } from './components/CreateSnippetModal';
import { useAuth } from './hooks/useAuth';
import { useSnippets } from './hooks/useSnippets';
import type { Snippet } from './types/snippet';

function App() {
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const { 
    snippets, 
    loading: snippetsLoading, 
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    selectedArtifactType,
    handleSearch,
    handleArtifactTypeChange,
    handlePageChange,
    createSnippet,
    updateSnippet
  } = useSnippets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-purple-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzllYTNiYSIgZmlsbC1vcGFjaXR5PSIwLjAzIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPgo8L2c+CjwvZz4KPC9zdmc+')] opacity-20"></div>
      
      <div className="relative z-10">
        <Header 
          user={user}
          onSignIn={() => setShowAuthModal(true)}
          onSignOut={signOut}
          onCreateSnippet={() => setShowCreateModal(true)}
        />

        <main className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodeSnipNow
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Your modern ServiceNow automation blueprint catalog. Discover, share, and reuse code snippets with the community.
            </p>
          </div>

          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            selectedArtifactType={selectedArtifactType}
            onArtifactTypeChange={handleArtifactTypeChange}
            user={user}
          />

          {selectedArtifactType === 'integrations' ? (
            <IntegrationsGrid />
          ) : (
            <>
              <SnippetGrid 
                snippets={snippets}
                loading={snippetsLoading}
                onSnippetClick={setSelectedSnippet}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={12}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </main>

        {selectedSnippet && (
          <SnippetModal
            snippet={selectedSnippet}
            onClose={() => setSelectedSnippet(null)}
            user={user}
            onUpdateSnippet={async (snippetId, updates) => {
              // Update the snippet in the database and refresh the list
              try {
                // Pass the artifact_type to help with table identification
                const updatesWithType = { ...updates, artifact_type: selectedSnippet.artifact_type };
                await updateSnippet(snippetId, updatesWithType);
                // Refresh the snippets list
                handlePageChange(currentPage);
                // Update the selected snippet if it's still open
                if (selectedSnippet && selectedSnippet.id === snippetId) {
                  setSelectedSnippet({ ...selectedSnippet, ...updates });
                }
              } catch (error) {
                console.error('Failed to update snippet:', error);
                throw error;
              }
            }}
          />
        )}

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSignIn={signIn}
            onSignUp={signUp}
            loading={authLoading}
          />
        )}

        {showCreateModal && user && (
          <CreateSnippetModal
            onClose={() => setShowCreateModal(false)}
            onCreateSnippet={async (data, userId) => {
              await createSnippet(data, userId);
            }}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

export default App;
