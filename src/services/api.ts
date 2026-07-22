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
  Overall: number;
  TotalVotos: number;
}

export interface GameStats {
  GameID: string;
  Data: string;
  Resultado_A: number;
  Resultado_B: number;
  Equipa_A: string[];
  Equipa_B: string[];
}

export const fetchUsers = async (): Promise<UserStats[]> => {
  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    console.warn("GAS_URL not configured. Returning mock data.");
    return mockUsers;
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_users`);
    const data = await res.json();
    if (data.success) return data.data;
    throw new Error(data.error);
  } catch (error) {
    // Erro silenciado para evitar exposição de dados sensíveis da rede
    return [];
  }
};

export const fetchGames = async (): Promise<GameStats[]> => {
  if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
    return mockGames;
  }
  
  try {
    const res = await fetch(`${GAS_URL}?action=get_games`);
    const data = await res.json();
    if (data.success) return data.data;
    throw new Error(data.error);
  } catch (error) {
    return [];
  }
};

export const registerUser = async (token: string): Promise<boolean> => {
  return sendPostRequest({ action: 'register_user', token });
};

export const votePlayer = async (token: string, targetEmail: string, ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number): Promise<boolean> => {
  return sendPostRequest({ action: 'vote', token, data: { targetEmail, ataque, defesa, fisico, passe, guardaRedes } });
};

export const registerGame = async (token: string, resA: number, resB: number, equipaA: string[], equipaB: string[]): Promise<{success: boolean, error?: string}> => {
  try {
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'register_game',
        token,
        resA,
        resB,
        equipaA,
        equipaB
      })
    });
    const data = await res.json();
    return data;
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
    // Erro silenciado para evitar exposição de payload
    return false;
  }
}

// Mock Data for testing UI without backend
const mockUsers: UserStats[] = [
  { Nome: "Fernando Goncalves", Email: "fmng2000@gmail.com", Vitorias: 0, Empates: 2, Derrotas: 0, Pontos_Totais: 2, Jogos_Jogados: 2, Avatar: "https://lh3.googleusercontent.com/a/ACg8ocLF6v_dDEa53R0V3N_MhGv27b13m5dZ5_hBwH_xS1p1HkGv1w=s96-c", Ataque: 50, Defesa: 50, Fisico: 50, Passe: 53, Guarda_Redes: 50, Overall: 51, TotalVotos: 2 },
  { Nome: "NEON", Email: "neonspaceyt@gmail.com", Vitorias: 0, Empates: 2, Derrotas: 0, Pontos_Totais: 2, Jogos_Jogados: 2, Avatar: "https://lh3.googleusercontent.com/a/ACg8ocL81bQ6J5zP8YhR-9jT5-z4XWk13B6wM4x_E_G3Z0W2T=s96-c", Ataque: 0, Defesa: 0, Fisico: 0, Passe: 0, Guarda_Redes: 0, Overall: 0, TotalVotos: 0 },
  { Nome: "João Silva", Email: "joao@example.com", Vitorias: 5, Empates: 1, Derrotas: 2, Pontos_Totais: 16, Jogos_Jogados: 8, Avatar: "", Ataque: 85, Defesa: 60, Fisico: 75, Passe: 80, Guarda_Redes: 50, Overall: 75, TotalVotos: 4 },
  { Nome: "Carlos Costa", Email: "carlos@example.com", Vitorias: 3, Empates: 3, Derrotas: 2, Pontos_Totais: 12, Jogos_Jogados: 8, Avatar: "", Ataque: 70, Defesa: 88, Fisico: 85, Passe: 70, Guarda_Redes: 50, Overall: 78, TotalVotos: 3 },
  { Nome: "Miguel Nunes", Email: "miguel@example.com", Vitorias: 6, Empates: 0, Derrotas: 2, Pontos_Totais: 18, Jogos_Jogados: 8, Avatar: "", Ataque: 92, Defesa: 40, Fisico: 70, Passe: 82, Guarda_Redes: 50, Overall: 71, TotalVotos: 5 },
];

const mockGames: GameStats[] = [
  { GameID: "1", Data: new Date().toISOString(), Resultado_A: 5, Resultado_B: 4, Equipa_A: ["joao@example.com"], Equipa_B: ["carlos@example.com", "miguel@example.com"] }
];
