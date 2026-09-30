import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GAS_URL = process.env.VITE_GAS_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchFromGAS(action: string) {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', action);
    const res = await fetch(url.toString());
    const data = await res.json();
    return data.data;
}

async function fixPolls() {
    console.log("Fetching old locations from GAS...");
    const oldLocations = await fetchFromGAS('get_locations');
    
    console.log("Fetching new locations from Supabase...");
    const { data: newLocations } = await supabase.from('global_locations').select('*');
    
    const locationMap: Record<string, string> = {};
    for (const old of oldLocations) {
        const matchingNew = newLocations?.find(n => n.nome === old.Nome);
        if (matchingNew) {
            locationMap[old.LocationID] = matchingNew.id;
        }
    }
    console.log("Location mapping:", locationMap);

    console.log("Fetching polls...");
    const { data: polls } = await supabase.from('polls').select('*');
    if (!polls) return;

    for (const poll of polls) {
        let updated = false;
        const newPollLocations = [];
        for (const loc of poll.locations) {
            if (loc.startsWith('loc_')) {
                const mapped = locationMap[loc];
                if (mapped) {
                    newPollLocations.push(mapped);
                    updated = true;
                }
            } else {
                newPollLocations.push(loc);
            }
        }

        if (updated) {
            console.log(`Updating poll ${poll.id}...`);
            await supabase.from('polls').update({ locations: newPollLocations }).eq('id', poll.id);
        }
    }
    
    console.log("Done!");
}

fixPolls();
