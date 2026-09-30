import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const getDriveId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

async function downloadDriveImage(url: string) {
    const id = getDriveId(url);
    if (!id) return null;
    const downloadUrl = `https://drive.google.com/uc?id=${id}&export=download`;
    console.log(`Downloading ${downloadUrl}`);
    const res = await fetch(downloadUrl);
    if (!res.ok) {
        console.error(`Failed to download ${downloadUrl}`);
        return null;
    }
    const buffer = await res.arrayBuffer();
    // try to guess mime type from headers
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    return { buffer: Buffer.from(buffer), ext, contentType };
}

async function migratePhotos() {
    console.log("Migrating Expenses Photos...");
    const { data: expenses } = await supabase.from('expenses').select('*');
    if (expenses) {
        for (const exp of expenses) {
            if (exp.foto_url && exp.foto_url.includes('drive.google.com')) {
                const img = await downloadDriveImage(exp.foto_url);
                if (img) {
                    const fileName = `expenses/${exp.id}.${img.ext}`;
                    const { error: uploadError } = await supabase.storage.from('tikitasco-storage').upload(fileName, img.buffer, {
                        contentType: img.contentType,
                        upsert: true
                    });
                    if (!uploadError) {
                        const newUrl = `${SUPABASE_URL}/storage/v1/object/public/tikitasco-storage/${fileName}`;
                        await supabase.from('expenses').update({ foto_url: newUrl }).eq('id', exp.id);
                        console.log(`Updated expense ${exp.id} with ${newUrl}`);
                    } else {
                        console.error(`Upload error for expense ${exp.id}:`, uploadError);
                    }
                }
            }
        }
    }

    console.log("Migrating Locations Photos...");
    const { data: locations } = await supabase.from('global_locations').select('*');
    if (locations) {
        for (const loc of locations) {
            if (loc.fotos_url && loc.fotos_url.includes('drive.google.com')) {
                const urls = loc.fotos_url.split(',').map((u: string) => u.trim());
                const newUrls: string[] = [];
                for (let i = 0; i < urls.length; i++) {
                    if (urls[i].includes('drive.google.com')) {
                        const img = await downloadDriveImage(urls[i]);
                        if (img) {
                            const fileName = `locations/${loc.id}_${i}.${img.ext}`;
                            const { error: uploadError } = await supabase.storage.from('tikitasco-storage').upload(fileName, img.buffer, {
                                contentType: img.contentType,
                                upsert: true
                            });
                            if (!uploadError) {
                                newUrls.push(`${SUPABASE_URL}/storage/v1/object/public/tikitasco-storage/${fileName}`);
                            } else {
                                console.error(`Upload error for location ${loc.id} image ${i}:`, uploadError);
                                newUrls.push(urls[i]);
                            }
                        } else {
                            newUrls.push(urls[i]);
                        }
                    } else {
                        newUrls.push(urls[i]);
                    }
                }
                const finalUrlString = newUrls.join(',');
                if (finalUrlString !== loc.fotos_url) {
                    await supabase.from('global_locations').update({ fotos_url: finalUrlString }).eq('id', loc.id);
                    console.log(`Updated location ${loc.nome} with ${finalUrlString}`);
                }
            }
        }
    }
    
    console.log("Photo Migration Complete!");
}

migratePhotos();
