import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yeoelwmqfbtwgepubuhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb2Vsd21xZmJ0d2dlcHVidWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDg2ODksImV4cCI6MjA5MjQ4NDY4OX0.wg7abNj6YVY6C-T1QsMatChmu0ct5BPu8hwIWKrvZFU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function dumpMatches() {
    console.log("Fetching match summary from Supabase...");
    const { data, error } = await supabase
        .from('tournament_data')
        .select('data')
        .eq('id', 1)
        .single();

    if (error) {
        console.error("Error:", error.message);
    } else {
        const tournament = data.data;
        console.log("Matches Summary:");
        tournament?.matches?.forEach(m => {
            const ballCount = m.innings?.reduce((acc, inn) => acc + (inn.overs?.reduce((oAcc, o) => oAcc + (o.balls?.length || 0), 0) || 0), 0) || 0;
            console.log(`ID: ${m.id}, Title: ${m.title}, Status: ${m.status}, Balls: ${ballCount}`);
        });
    }
}

dumpMatches();
