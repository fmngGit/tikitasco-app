import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GAS_URL = process.env.VITE_GAS_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchFromGAS(action: string, params: Record<string, string> = {}) {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', action);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'GAS Error');
    return data.data;
}

async function migrateVotes() {
    console.log("Fetching users to migrate votes...");
    const users = await fetchFromGAS('get_users');
    console.log(`Found ${users.length} users. Fetching votes for each...`);

    let totalVotes = 0;
    
    for (const user of users) {
        const email = user.Email;
        try {
            const votesData = await fetchFromGAS('get_my_votes', { email });
            const votes = [];
            for (const [targetEmail, stats] of Object.entries(votesData)) {
                votes.push({
                    group_id: '34f5269e-1aac-4041-93a9-0841bb7cf3ed', // default group
                    voter_email: email,
                    target_user_email: targetEmail,
                    ataque: (stats as any).ataque,
                    defesa: (stats as any).defesa,
                    fisico: (stats as any).fisico,
                    passe: (stats as any).passe,
                    guarda_redes: (stats as any).guardaRedes,
                    fairplay: (stats as any).fairplay
                });
            }

            if (votes.length > 0) {
                const { error } = await supabase.from('votes').upsert(votes, { onConflict: 'voter_email,target_user_email' });
                if (error) {
                    console.error(`Error inserting votes for ${email}:`, error.message);
                } else {
                    totalVotes += votes.length;
                }
            }
        } catch (err: any) {
            console.error(`Failed to fetch votes for ${email}:`, err.message);
        }
    }
    
    console.log(`Migration Complete! Migrated a total of ${totalVotes} individual votes.`);
}

migrateVotes();
