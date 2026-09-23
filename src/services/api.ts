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
  FieldCost?: number;
  Fee?: number;
  LocationID?: string;
}

export interface Expense {
  ExpenseID: string;
  Data: string;
  Descricao: string;
  Valor: number;
  FotoUrl?: string; // URLs armazenados (pode ser múltiplos, separados por vírgula)
  RegistadoPor?: string;
  ValorCaixa?: number;
  ContribuicoesDiretas?: { email: string; amount: number }[];
}

export const getDriveImageUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    // Usar o endpoint thumbnail do Drive para evitar problemas de CORS e redirecionamento de download
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  return url;
};

export interface SessionRound {
  resA: number;
  resB: number;
  equipaA: string[];
  equipaB: string[];
  roundNumber?: number;
}

export interface Location {
  LocationID: string;
  Nome: string;
  Morada: string;
  PrecoHora: number;
  PrecoBola?: number;
  PrecoColetes?: number;
  TipoPiso?: string;
  Indoor?: number; // 0 ou 1
  Balnearios?: number; // 0 ou 1
  TipoFutebol?: string;
  FotosUrl?: string;
  RegistadoPor?: string;
  Telefone?: string;
  Email?: string;
  Notas?: string;
}

export interface PollVote {
  TargetWeek: string;
  UserEmail: string;
  Timestamp?: string;
  Monday: string[];
  Tuesday: string[];
  Wednesday: string[];
  Thursday: string[];
  Locations: string[];
}

// In-memory cache com invalidação inteligente para navegação rápida
let usersCache: UserStats[] | null = null;
let gamesCache: GameStats[] | null = null;
let expensesCache: Expense[] | null = null;
let locationsCache: Location[] | null = null;
let pollsCache: Record<string, PollVote[]> = {};

let lastUsersFetch = 0;
let lastGamesFetch = 0;
let lastExpensesFetch = 0;
let lastLocationsFetch = 0;
let lastPollsFetch: Record<string, number> = {};
const CACHE_TTL = 30000; // 30 segundos

// Força a renovação dos dados na próxima chamada
export const invalidateCache = () => {
  usersCache = null;
  gamesCache = null;
  expensesCache = null;
  locationsCache = null;
  pollsCache = {};
  lastUsersFetch = 0;
  lastGamesFetch = 0;
  lastExpensesFetch = 0;
  lastLocationsFetch = 0;
  lastPollsFetch = {};
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

export const fetchExpenses = async (forceRefresh = false): Promise<Expense[]> => {
  const now = Date.now();
  if (!forceRefresh && expensesCache && now - lastExpensesFetch < CACHE_TTL) {
    return expensesCache;
  }

  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    expensesCache = mockExpenses;
    return mockExpenses;
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_expenses`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      const parsedData = data.data.map((exp: any) => ({
        ...exp,
        ValorCaixa: exp.ValorCaixa !== undefined && exp.ValorCaixa !== '' ? Number(exp.ValorCaixa) : Number(exp.Valor),
        ContribuicoesDiretas: exp.ContribuicoesDiretas ? (typeof exp.ContribuicoesDiretas === 'string' ? JSON.parse(exp.ContribuicoesDiretas) : exp.ContribuicoesDiretas) : []
      }));
      expensesCache = parsedData;
      lastExpensesFetch = Date.now();
      return parsedData;
    }
    throw new Error(data.error);
  } catch (error) {
    return expensesCache || [];
  }
};

export const fetchLocations = async (forceRefresh = false): Promise<Location[]> => {
  const now = Date.now();
  if (!forceRefresh && locationsCache && now - lastLocationsFetch < CACHE_TTL) {
    return locationsCache;
  }

  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    locationsCache = [];
    return [];
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_locations`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      const parsedData = data.data.map((loc: any) => ({
        ...loc,
        PrecoHora: Number(loc.PrecoHora) || 0,
        PrecoBola: loc.PrecoBola ? Number(loc.PrecoBola) : undefined,
        PrecoColetes: loc.PrecoColetes ? Number(loc.PrecoColetes) : undefined,
        Indoor: Number(loc.Indoor),
        Balnearios: Number(loc.Balnearios)
      }));
      locationsCache = parsedData;
      lastLocationsFetch = Date.now();
      return parsedData;
    }
    throw new Error(data.error);
  } catch (error) {
    return locationsCache || [];
  }
};

export const registerUser = async (token: string): Promise<boolean> => {
  invalidateCache();
  const result = await sendPostRequest({ action: 'register_user', token });
  return !!result?.success;
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

// Upload de Fatura/Recibo para Google Drive
export const uploadReceiptToDrive = async (token: string, base64: string, filename: string): Promise<{success: boolean, fileUrl?: string, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return { success: true, fileUrl: 'https://via.placeholder.com/300x400.png?text=Fatura+Mock' };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'upload_receipt',
        token,
        base64,
        filename
      })
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
  roundNumber?: number,
  fieldCost?: number,
  fee?: number,
  locationId?: string
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
        roundNumber: roundNumber || 1,
        fieldCost: fieldCost || 0,
        fee: fee || 0,
        locationId: locationId || ''
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
    locationId?: string;
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
  videoData?: { fileId?: string, downloadUrl?: string, expiryDate?: string },
  locationId?: string
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
        videoExpiryDate: videoData?.expiryDate,
        locationId
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

export const registerExpense = async (
  token: string,
  date: string,
  description: string,
  amount: number,
  photoUrl?: string,
  boxAmount?: number,
  directContributions?: { email: string; amount: number }[]
): Promise<{ success: boolean, error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'register_expense',
        token,
        date,
        description,
        amount,
        photoUrl: photoUrl || '',
        boxAmount: boxAmount !== undefined ? boxAmount : amount,
        directContributions: directContributions || []
      })
    });
    const data = await res.json();
    if (data.success) invalidateCache();
    return data;
  } catch (err: any) {
    return { success: false, error: err.toString() };
  }
};

export const editExpense = async (
  token: string,
  expenseId: string,
  date: string,
  description: string,
  amount: number,
  photoUrl?: string,
  boxAmount?: number,
  directContributions?: { email: string; amount: number }[]
): Promise<{ success: boolean, error?: string }> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      invalidateCache();
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit_expense',
        token,
        expenseId,
        date,
        description,
        amount,
        photoUrl: photoUrl || '',
        boxAmount: boxAmount !== undefined ? boxAmount : amount,
        directContributions: directContributions || []
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

export const registerLocation = async (
  token: string, 
  nome: string, 
  morada: string, 
  precoHora: number, 
  precoBola: number | undefined, 
  precoColetes: number | undefined, 
  tipoPiso: string, 
  indoor: boolean, 
  balnearios: boolean, 
  tipoFutebol: string, 
  fotosUrl: string,
  telefone: string,
  email: string,
  notas: string
): Promise<{ success: boolean, message?: string, error?: string }> => {
  invalidateCache();
  return sendPostRequest({
    action: 'register_location',
    token, nome, morada, precoHora, precoBola, precoColetes, tipoPiso, indoor, balnearios, tipoFutebol, fotosUrl, telefone, email, notas
  });
};

export const editLocation = async (
  token: string, 
  locationId: string,
  nome: string, 
  morada: string, 
  precoHora: number, 
  precoBola: number | undefined, 
  precoColetes: number | undefined, 
  tipoPiso: string, 
  indoor: boolean, 
  balnearios: boolean, 
  tipoFutebol: string, 
  fotosUrl: string,
  telefone: string,
  email: string,
  notas: string
): Promise<{ success: boolean, message?: string, error?: string }> => {
  invalidateCache();
  return sendPostRequest({
    action: 'edit_location',
    token, locationId, nome, morada, precoHora, precoBola, precoColetes, tipoPiso, indoor, balnearios, tipoFutebol, fotosUrl, telefone, email, notas
  });
};

export const deleteLocation = async (token: string, locationId: string): Promise<{ success: boolean, message?: string, error?: string }> => {
  invalidateCache();
  return sendPostRequest({
    action: 'delete_location',
    token, locationId
  });
};

const sendPostRequest = async (payload: any): Promise<any> => {
  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) return { success: true };
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.toString() };
  }
};


export const fetchPolls = async (weekId: string, forceRefresh = false): Promise<PollVote[]> => {
  const now = Date.now();
  if (!forceRefresh && pollsCache[weekId] && now - (lastPollsFetch[weekId] || 0) < CACHE_TTL) {
    return pollsCache[weekId];
  }

  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    return [];
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_polls&weekId=${encodeURIComponent(weekId)}`);
    const data = await res.json();
    if (data.success) {
      pollsCache[weekId] = data.data || [];
      lastPollsFetch[weekId] = now;
      return pollsCache[weekId];
    }
    throw new Error(data.error);
  } catch (error) {
    return pollsCache[weekId] || [];
  }
};

export const submitPollVote = async (
  token: string, 
  targetWeek: string, 
  monday: string[], 
  tuesday: string[], 
  wednesday: string[], 
  thursday: string[], 
  locations: string[]
): Promise<{ success: boolean, message?: string, error?: string }> => {
  // Invalidar a cache daquela semana especificamente
  pollsCache[targetWeek] = null as any; 
  lastPollsFetch[targetWeek] = 0;
  
  return sendPostRequest({
    action: 'submit_poll',
    token, targetWeek, monday, tuesday, wednesday, thursday, locations
  });
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
  { GameID: "1", Data: new Date().toISOString(), Resultado_A: 5, Resultado_B: 4, Equipa_A: ["fmng2000@gmail.com", "joao@example.com"], Equipa_B: ["carlos@example.com", "miguel@example.com"], SessionType: "standard", FieldCost: 20, Fee: 0.5 }
];

const mockExpenses: Expense[] = [
  { ExpenseID: "exp_1", Data: new Date().toISOString(), Descricao: "Bola nova e Coletes", Valor: 35.50, RegistadoPor: "fmng2000@gmail.com" }
];
