import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Hardcoded mapping for known snippets - extend as needed
const repoPathMapping: { [key: string]: string } = {
  'Enhanced Action Widget for Standard Ticket Page': 'Modern Development/Service Portal Widgets/Standard Ticket Page Enhanced Action Widget',
  'Squid Game Themed Incident - Request - Knowledge Widget': 'Modern Development/Service Portal Widgets/Squid Game Themed Incident-Request-Knowledge', // Example from previous
  // Add more mappings here based on snippet names
};

async function populateRepoPaths() {
  try {
    // Target service_portal_widgets table for widget examples
    const table = 'service_portal_widgets';
    const { data: snippets, error: fetchError } = await supabase
      .from(table)
      .select('*');

    if (fetchError) throw fetchError;

    console.log(`Found ${snippets?.length || 0} snippets in ${table}`);

    let updatedCount = 0;

    for (const snippet of snippets || []) {
      const title = snippet.title;
      if (!title || snippet.repo_path) continue; // Skip if no title or already set

      const derivedRepoPath = `Modern Development/Service Portal Widgets/${title}`;
      const { error: updateError } = await supabase
        .from(table)
        .update({ repo_path: derivedRepoPath })
        .eq('id', snippet.id);

      if (updateError) {
        console.error(`Failed to update "${title}":`, updateError);
      } else {
        console.log(`Updated repo_path for "${title}" to "${derivedRepoPath}"`);
        updatedCount++;
      }
    }

    console.log(`Population complete for service_portal_widgets - Updated ${updatedCount} snippets`);
  } catch (err) {
    console.error('Error populating repo_paths:', err);
  }
}

populateRepoPaths();
