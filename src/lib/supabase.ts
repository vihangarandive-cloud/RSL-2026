import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yeoelwmqfbtwgepubuhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb2Vsd21xZmJ0d2dlcHVidWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDg2ODksImV4cCI6MjA5MjQ4NDY4OX0.wg7abNj6YVY6C-T1QsMatChmu0ct5BPu8hwIWKrvZFU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
