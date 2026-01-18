
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for the script (same as in databaseService.ts)
const SUPABASE_URL = 'https://opwgkwunnwfjpiwzwdfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nKL7jnc-7r5RGlpmdBAecg_AnY6iQ6W';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLatest() {
    console.log("Checking latest saved article...");
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching articles:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Latest Article:");
            console.log(`- Title: ${data[0].title}`);
            console.log(`- Saved At: ${data[0].created_at}`);
            console.log(`- URL: ${data[0].source_url}`);
        } else {
            console.log("No articles found in the database.");
        }
    }
}

checkLatest();
