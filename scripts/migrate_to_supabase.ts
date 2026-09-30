import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load env vars
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use the secret key for admin rights during migration
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GAS_URL = process.env.VITE_GAS_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GAS_URL) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchFromGAS(action: string) {
    console.log(`Fetching ${action} from Google Sheets...`);
    const res = await fetch(`${GAS_URL}?action=${action}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
}

async function runMigration() {
    console.log('Starting Migration to Supabase...');
    
    // 1. Create Default Group
    console.log('Fetching/Creating Default Group...');
    let groupId;
    const { data: existingGroup } = await supabase.from('groups').select('id').eq('invite_code', 'TIKI-ORIG').single();
    if (existingGroup) {
        groupId = existingGroup.id;
    } else {
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert([{ name: 'TikiTasco Original', invite_code: 'TIKI-ORIG' }])
            .select()
            .single();
        if (groupError) {
            console.error('Error creating group:', groupError);
            return;
        }
        groupId = group.id;
    }
    console.log(`Default Group Created: ${groupId}`);

    // 2. Fetch Users
    const users = await fetchFromGAS('get_users');
    console.log(`Fetched ${users.length} users.`);
    
    for (const u of users) {
        // Insert User
        const { error: userError } = await supabase.from('users').upsert({
            email: u.Email,
            nome: u.Nome,
            avatar_url: u.Avatar,
            is_guest: u.IsGuest || false
        });
        
        if (userError) console.error(`Error migrating user ${u.Email}:`, userError);
        
        // Add to group
        await supabase.from('group_members').upsert({
            user_email: u.Email,
            group_id: groupId,
            role: 'member'
        });
    }

    // 3. Fetch Games
    const games = await fetchFromGAS('get_games');
    console.log(`Fetched ${games.length} games.`);
    for (const g of games) {
        const { error: gameError } = await supabase.from('games').insert({
            id: g.GameID,
            group_id: groupId,
            date: g.Data,
            res_a: g.Resultado_A,
            res_b: g.Resultado_B,
            equipa_a: g.Equipa_A || [],
            equipa_b: g.Equipa_B || [],
            session_id: g.SessionID,
            session_type: g.SessionType,
            video_file_id: g.VideoFileId,
            video_download_url: g.VideoDownloadUrl,
            video_expiry_date: g.VideoExpiryDate ? new Date(g.VideoExpiryDate) : null,
            round_number: g.RoundNumber,
            field_cost: g.FieldCost,
            fee: g.Fee,
            location_id: g.LocationID
        });
        if (gameError) console.error(`Error migrating game ${g.GameID}:`, gameError);
    }

    // 4. Fetch Expenses
    const expenses = await fetchFromGAS('get_expenses');
    console.log(`Fetched ${expenses.length} expenses.`);
    for (const e of expenses) {
        const { error: expError } = await supabase.from('expenses').insert({
            group_id: groupId,
            date: e.Data,
            descricao: e.Descricao,
            valor: e.Valor,
            foto_url: e.FotoUrl,
            registado_por: e.RegistadoPor,
            valor_caixa: e.ValorCaixa,
            contribuicoes_diretas: typeof e.ContribuicoesDiretas === 'string' ? JSON.parse(e.ContribuicoesDiretas) : (e.ContribuicoesDiretas || [])
        });
        if (expError) console.error(`Error migrating expense ${e.ExpenseID}:`, expError);
    }
    
    // We would need a custom script/export to get the Votes since the GET endpoint gets aggregated users, 
    // and the POST `get_my_votes` is per user. For a perfect migration, we'd need to extract Votes from the spreadsheet directly.
    // Assuming for this script we will migrate Users, Games and Expenses as the primary payload.
    // Votes are aggregated in the Leaderboard. To retain exact vote history, a CSV export of the 'Votes' sheet is ideal.

    console.log('Migration Completed! (Note: Votes require CSV export or a specialized endpoint)');
}

runMigration().catch(console.error);
