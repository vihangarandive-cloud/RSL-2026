import { createClient } from '@supabase/supabase-js';
import { INITIAL_DATA } from '../src/lib/initialData';

const supabaseUrl = 'https://yeoelwmqfbtwgepubuhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb2Vsd21xZmJ0d2dlcHVidWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDg2ODksImV4cCI6MjA5MjQ4NDY4OX0.wg7abNj6YVY6C-T1QsMatChmu0ct5BPu8hwIWKrvZFU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndRestore() {
    console.log("Checking Supabase data...");
    const { data, error } = await supabase
        .from('tournament_data')
        .select('data')
        .eq('id', 1)
        .single();

    if (error) {
        console.log("Error or no data found:", error.message);
        console.log("Attempting to restore INITIAL_DATA...");
        const { error: upsertError } = await supabase
            .from('tournament_data')
            .upsert({ id: 1, data: INITIAL_DATA, updated_at: new Date().toISOString() });
        
        if (upsertError) {
            console.error("Failed to restore data:", upsertError.message);
        } else {
            console.log("INITIAL_DATA successfully restored to Supabase.");
        }
    } else {
        const tournament = data.data;
        console.log("Data already exists in Supabase.");
        console.log("Matches count:", tournament?.matches?.length);
        console.log("Teams count:", tournament?.teams?.length);
        
        const matchesWithInnings = tournament?.matches?.filter(m => m.innings && m.innings.length > 0).length;
        console.log("Matches with innings data:", matchesWithInnings);

        const totalBalls = tournament?.matches?.reduce((acc, m) => {
            return acc + (m.innings?.reduce((iAcc, inn) => iAcc + (inn.overs?.reduce((oAcc, o) => oAcc + (o.balls?.length || 0), 0) || 0), 0) || 0);
        }, 0);
        console.log("Total balls recorded across all matches:", totalBalls);
    }
}

checkAndRestore();
