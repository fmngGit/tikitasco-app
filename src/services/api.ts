const GAS_URL = import.meta.env.VITE_GAS_URL;

export interface UserStats {
  Nome: string;
  Email: string;
  Vitorias: number;
  Empates: number;
  Derrotas: number;
  Pontos_Totais: number;
  Jogos_Jogados: number;
  Avatar: string;
  Ataque: number;
  Defesa: number;
  Fisico: number;
  Passe: number;
  Guarda_Redes: number;
  Fairplay: number;
  Overall: number;
  TotalVotos: number;
  IsGuest?: boolean;
  CreatedBy?: string;
}

export interface GameStats {
  GameID: string;
  Data: string;
  Resultado_A: number;
  Resultado_B: number;
  Equipa_A: string[];
  Equipa_B: string[];
  SessionID?: string;
  SessionType?: 'standard' | 'reidapista' | 'rotacao_dinamica';
  VideoFileId?: string;
  VideoDownloadUrl?: string;
  VideoExpiryDate?: string;
  RoundNumber?: number;
}

export interface SessionRound {
  resA: number;
  resB: number;
  equipaA: string[];
  equipaB: string[];
  roundNumber?: number;
}

// In-memory cache com invalidação inteligente para navegação rápida
let usersCache: UserStats[] | null = null;
let gamesCache: GameStats[] | null = null;
let lastUsersFetch = 0;
let lastGamesFetch = 0;
const CACHE_TTL = 30000; // 30 segundos

export const invalidateCache = () => {
  usersCache = null;
  gamesCache = null;
};

export const sortUsersByName = <T extends { Nome?: string; name?: string }>(list: T[]): T[] => {
  return [...list].sort((a, b) => {
    const nameA = a.Nome || (a as any).name || '';
    const nameB = b.Nome || (b as any).name || '';
    return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
  });
};

export const fetchUsers = async (forceRefresh = false): Promise<UserStats[]> => {
  const now = Date.now();
  if (!forceRefresh && usersCache && now - lastUsersFetch < CACHE_TTL) {
    return usersCache;
  }

  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    usersCache = sortUsersByName(mockUsers);
    return usersCache;
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_users`);
    const data = await res.json();
    if (data.success) {
      const sortedUsers = sortUsersByName<UserStats>(data.data || []);
      usersCache = sortedUsers;
      lastUsersFetch = now;
      return sortedUsers;
    }
    throw new Error(data.error);
  } catch (error) {
    return usersCache || [];
  }
};

export const fetchGames = async (forceRefresh = false): Promise<GameStats[]> => {
  const now = Date.now();
  if (!forceRefresh && gamesCache && now - lastGamesFetch < CACHE_TTL) {
    return gamesCache;
  }

  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    gamesCache = mockGames;
    return mockGames;
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_games`);
    const data = await res.json();
    if (data.success) {
      gamesCache = data.data;
      lastGamesFetch = now;
      return data.data;
    }
    throw new Error(data.error);
  } catch (error) {
    return gamesCache || [];
  }
};

export const registerUser = async (token: string): Promise<boolean> => {
  invalidateCache();
  return sendPostRequest({ action: 'register_user', token });
};

// Criação de jogador convidado / fantasma
export const createGuestPlayer = async (token: string, name: string): Promise<{ success: boolean, user?: UserStats, error?: string }> => {
  if (!token) {
    return { success: false, error: 'Precisas de iniciar sessão com a conta Google para adicionar convidados.' };
  }

  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      const mockGuest: UserStats = {
        Nome: name,
        Email: `guest_${Date.now()}@convidado.tikitasco`,
        Vitorias: 0,
        Empates: 0,
        Derrotas: 0,
        Pontos_Totais: 0,
        Jogos_Jogados: 0,
        Avatar: '',
        Ataque: 50,
        Defesa: 50,
        Fisico: 50,
        Passe: 50,
        Guarda_Redes: 50,
        Fairplay: 50,
        Overall: 50,
        TotalVotos: 0,
        IsGuest: true
      };
      if (usersCache) usersCache.push(mockGuest);
      return { success: true, user: mockGuest };
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'create_guest', token, name })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: text.includes('drive-logo') || text.includes('<!DOCTYPE')
          ? 'O Google Apps Script não respondeu com JSON. Verifica a implementação no Apps Script.'
          : 'Resposta inesperada do servidor ao criar convidado.'
      };
    }

    if (data.success) {
      invalidateCache();
      // Adicionar imediatamente ao cache local se disponível
      if (data.user && usersCache) {
        usersCache.push(data.user);
      }
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

// Reivindicar jogador fantasma quando o utilizador entra com a conta Google real
export const claimGhostPlayer = async (token: string, ghostEmail: string): Promise<{ success: boolean, message?: string, error?: string }> => {
  if (!token) {
    return { success: false, error: 'Precisas de iniciar sessão com a conta Google.' };
  }

  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return { success: true, message: "Perfil de convidado associado (Modo Mock)" };
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'claim_ghost_player', token, ghostEmail })
    });
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: 'Resposta inesperada do servidor ao associar perfil.' };
    }

    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

// Upload de Vídeo direto para Google Drive usando Resumable Upload
export const initiateVideoUpload = async (token: string, fileName: string, fileSize: number, mimeType: string): Promise<{ success: boolean, uploadUrl?: string, error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return { success: false, error: "Servidor não configurado para upload direto." };
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'initiate_video_upload',
        token,
        fileName,
        fileSize,
        mimeType,
        origin: window.location.origin
      })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const finalizeVideoUpload = async (token: string, fileId: string): Promise<{ success: boolean, fileId?: string, downloadUrl?: string, expiryDate?: string, error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return { success: true, fileId, downloadUrl: 'mock-url', expiryDate: new Date(Date.now() + 30*86400000).toISOString() };
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'finalize_video_upload', token, fileId })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

// Envio em stream do ficheiro para a Google Drive com callback de progresso
export const uploadVideoToDrive = (
  file: File, 
  uploadUrl: string, 
  onProgress?: (percent: number) => void
): Promise<{ success: boolean, fileId?: string, error?: string }> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    if (file.size > 0) {
      xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({ success: true, fileId: res.id });
        } catch {
          resolve({ success: true });
        }
      } else {
        resolve({ success: false, error: `Erro no upload do Google Drive (${xhr.status}): ${xhr.statusText}` });
      }
    };

    xhr.onerror = () => {
      resolve({ 
        success: false, 
        error: 'Erro de rede ou permissão CORS ao enviar para a Google Drive. Por favor atualiza o backend no Apps Script com a nova versão de backend.gs.' 
      });
    };

    xhr.send(file);
  });
};

export const fetchMyVotes = async (token: string): Promise<Record<string, { ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number, fairplay: number }>> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) return {};
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'get_my_votes', token })
    });
    const data = await res.json();
    if (data.success) return data.data;
    return {};
  } catch (err) {
    return {};
  }
};

export const votePlayer = async (token: string, targetEmail: string, ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number, fairplay: number): Promise<{success: boolean, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'vote', token, data: { targetEmail, ataque, defesa, fisico, passe, guardaRedes, fairplay } })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: 'Erro de conexão ao servidor.' };
  }
};

export const registerGame = async (
  token: string, 
  gameDate: string, 
  resA: number, 
  resB: number, 
  equipaA: string[], 
  equipaB: string[],
  videoData?: { fileId?: string, downloadUrl?: string, expiryDate?: string },
  sessionId?: string,
  sessionType?: 'standard' | 'reidapista' | 'rotacao_dinamica',
  roundNumber?: number
): Promise<{success: boolean, gameId?: string, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true, gameId: 'mock-id' };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'register_game',
        token,
        date: gameDate,
        resA,
        resB,
        equipaA,
        equipaB,
        sessionId: sessionId || '',
        sessionType: sessionType || 'standard',
        videoFileId: videoData?.fileId || '',
        videoDownloadUrl: videoData?.downloadUrl || '',
        videoExpiryDate: videoData?.expiryDate || '',
        roundNumber: roundNumber || 1
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const registerSession = async (
  token: string,
  sessionData: {
    date: string;
    sessionType: 'standard' | 'reidapista' | 'rotacao_dinamica';
    rounds: SessionRound[];
    videoFileId?: string;
    videoDownloadUrl?: string;
    videoExpiryDate?: string;
  }
): Promise<{ success: boolean, sessionId?: string, error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true, sessionId: 'mock-session-id' };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'register_session',
        token,
        ...sessionData
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const editGame = async (
  token: string, 
  gameId: string, 
  gameDate: string, 
  resA: number, 
  resB: number, 
  equipaA: string[], 
  equipaB: string[],
  videoData?: { fileId?: string, downloadUrl?: string, expiryDate?: string }
): Promise<{success: boolean, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit_game',
        token,
        gameId,
        date: gameDate,
        resA,
        resB,
        equipaA,
        equipaB,
        videoFileId: videoData?.fileId,
        videoDownloadUrl: videoData?.downloadUrl,
        videoExpiryDate: videoData?.expiryDate
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const deleteGame = async (token: string, gameId: string): Promise<{success: boolean, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_game',
        token,
        gameId
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const updateAvatar = async (token: string, base64: string): Promise<{success: boolean, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_avatar',
        token,
        base64
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const updateProfile = async (
  token: string,
  data: { name?: string; avatar?: string }
): Promise<{ success: boolean; message?: string; name?: string; avatar?: string; error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true, message: "Perfil atualizado com sucesso!" };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_profile',
        token,
        name: data.name,
        avatar: data.avatar
      })
    });
    const result = await res.json();
    if (result.success) invalidateCache();
    return result;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

const sendPostRequest = async (payload: any): Promise<boolean> => {
  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) return true;
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    return false;
  }
};

// Mock Data for offline testing
const mockUsers: UserStats[] = [
  { Nome: "Fernando Goncalves", Email: "fmng2000@gmail.com", Vitorias: 4, Empates: 2, Derrotas: 1, Pontos_Totais: 14, Jogos_Jogados: 7, Avatar: "https://lh3.googleusercontent.com/a/ACg8ocLF6v_dDEa53R0V3N_MhGv27b13m5dZ5_hBwH_xS1p1HkGv1w=s96-c", Ataque: 82, Defesa: 74, Fisico: 79, Passe: 86, Guarda_Redes: 55, Fairplay: 90, Overall: 78, TotalVotos: 6 },
  { Nome: "Carlos Costa", Email: "carlos@example.com", Vitorias: 3, Empates: 3, Derrotas: 2, Pontos_Totais: 12, Jogos_Jogados: 8, Avatar: "", Ataque: 70, Defesa: 88, Fisico: 85, Passe: 70, Guarda_Redes: 50, Fairplay: 90, Overall: 78, TotalVotos: 5 },
  { Nome: "Miguel Nunes", Email: "miguel@example.com", Vitorias: 6, Empates: 0, Derrotas: 2, Pontos_Totais: 18, Jogos_Jogados: 8, Avatar: "", Ataque: 92, Defesa: 40, Fisico: 70, Passe: 82, Guarda_Redes: 50, Fairplay: 70, Overall: 71, TotalVotos: 5 },
  { Nome: "João Silva", Email: "joao@example.com", Vitorias: 5, Empates: 1, Derrotas: 2, Pontos_Totais: 16, Jogos_Jogados: 8, Avatar: "", Ataque: 85, Defesa: 60, Fisico: 75, Passe: 80, Guarda_Redes: 50, Fairplay: 85, Overall: 75, TotalVotos: 4 },
  { Nome: "Rui Convidado", Email: "guest_123456@convidado.tikitasco", Vitorias: 1, Empates: 1, Derrotas: 0, Pontos_Totais: 4, Jogos_Jogados: 2, Avatar: "", Ataque: 68, Defesa: 65, Fisico: 72, Passe: 70, Guarda_Redes: 60, Fairplay: 80, Overall: 69, TotalVotos: 2, IsGuest: true },
];

const mockGames: GameStats[] = [
  { GameID: "1", Data: new Date().toISOString(), Resultado_A: 5, Resultado_B: 4, Equipa_A: ["fmng2000@gmail.com", "joao@example.com"], Equipa_B: ["carlos@example.com", "miguel@example.com"], SessionType: "standard" }
];
