import React, { useEffect, useState } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';

export function DiagnosticInfo() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: any = {
        supabaseConfigured: hasValidSupabaseCredentials,
        timestamp: new Date().toISOString()
      };

      if (hasValidSupabaseCredentials && supabase) {
        try {
          // Check core_serviceNow_apis table
          const { data: coreApis, error: coreError, count: coreCount } = await supabase
            .from('core_serviceNow_apis')
            .select('*', { count: 'exact' });

          results.coreServiceNowApis = {
            count: coreCount,
            error: coreError?.message,
            sampleData: coreApis?.slice(0, 2) // First 2 records
          };

          // Check integrations table
          const { data: integrations, error: intError, count: intCount } = await supabase
            .from('integrations')
            .select('*', { count: 'exact' });

          results.integrations = {
            count: intCount,
            error: intError?.message,
            sampleData: integrations?.slice(0, 2)
          };

          // Check user authentication
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          results.user = {
            authenticated: !!user,
            userId: user?.id,
            error: userError?.message
          };

        } catch (error: any) {
          results.error = error.message;
        }
      }

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return <div className="p-4 bg-slate-800 rounded-lg">Loading diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg text-white">
      <h3 className="text-lg font-semibold mb-4">Database Diagnostics</h3>
      <pre className="text-xs bg-slate-900 p-3 rounded overflow-auto max-h-96">
        {JSON.stringify(diagnostics, null, 2)}
      </pre>
    </div>
  );
}
