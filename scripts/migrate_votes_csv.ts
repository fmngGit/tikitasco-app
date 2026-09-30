import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateVotesCSV() {
    const csvPath = path.join(process.cwd(), 'votes.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("Arquivo votes.csv não encontrado na pasta raiz!");
        return;
    }

    console.log("A ler votes.csv...");
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const votesToInsert = [];
    
    // Ignorar cabeçalho na linha 0
    for (let i = 1; i < lines.length; i++) {
        // Separador pode ser vírgula
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 7) {
            const voterEmail = cols[0];
            const targetEmail = cols[1];
            
            let grVal = Number(cols[7]);
            let fpVal = Number(cols[8]);
            
            votesToInsert.push({
                voter_email: voterEmail,
                target_email: targetEmail,
                ataque: Number(cols[2]) || 50,
                defesa: Number(cols[3]) || 50,
                fisico: Number(cols[4]) || 50,
                passe: Number(cols[5]) || 50,
                guarda_redes: (isNaN(grVal) || grVal === 0) ? 50 : grVal,
                fairplay: (isNaN(fpVal) || fpVal === 0) ? 50 : fpVal
            });
        }
    }

    console.log(`Encontrados ${votesToInsert.length} votos. A inserir no Supabase...`);
    
    if (votesToInsert.length > 0) {
        const { error } = await supabase.from('votes').upsert(votesToInsert, { onConflict: 'voter_email,target_email' });
        if (error) {
            console.error("Erro ao inserir votos:", error.message);
        } else {
            console.log("Votos migrados com sucesso para os stats!");
        }
    }
}

migrateVotesCSV();
