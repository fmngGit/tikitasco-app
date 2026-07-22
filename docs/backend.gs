const SPREADSHEET_ID = "1Fuw9J3bvihY_daAr__NtVPmMxZHUL8WmkZRi6WDYlLU";

// Função utilitária para obter a folha de cálculo
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Configuração Inicial - Executa isto no Editor do Apps Script apenas uma vez
function setupSheets() {
  const ss = getSpreadsheet();
  
  const setupSheet = (name, headers) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      
      // Congelar a primeira linha (cabeçalho)
      sheet.setFrozenRows(1);
      // Estilizar o cabeçalho
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d9d9d9");
    }
  };

  setupSheet("Users", ["Nome", "Email", "Vitorias", "Empates", "Derrotas", "Pontos_Totais", "Jogos_Jogados", "Avatar"]);
  setupSheet("Votes", ["Voter_Email", "Target_Email", "Ataque", "Defesa", "Fisico", "Passe", "Timestamp", "Guarda_Redes", "Fairplay"]);
  setupSheet("Games", ["GameID", "Data", "Resultado_A", "Resultado_B", "Equipa_A", "Equipa_B"]);
}

// Validação do Token do Google Identity Services
function validateToken(token) {
  if (!token) return null;
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(response.getContentText());
    if (json.email) {
      return json; // Retorna email, name, picture
    }
  } catch (e) {
    // Logger silencioso para não expor a estrutura do token ou falhas criptográficas
    return null;
  }
  return null;
}

// Endpoint POST - Recebe dados do frontend
function doPost(e) {
  // Lidar com pedidos em modo 'text/plain' para evitar problemas de CORS no frontend
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Configuração do LockService para prevenir problemas de concorrência (múltiplos acessos ao mesmo tempo)
  const lock = LockService.getScriptLock();
  
  try {
    // Tenta obter o bloqueio por até 10 segundos
    lock.waitLock(10000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Servidor ocupado com demasiados pedidos. Tenta novamente em segundos." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const token = params.token;
    
    // Validar quem faz o pedido
    const userInfo = validateToken(token);
    if (!userInfo || !userInfo.email) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid or expired token. Please login again." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const userEmail = userInfo.email;

    if (action === "register_user") {
       const result = registerUser(userEmail, userInfo.name, userInfo.picture);
       lock.releaseLock();
       return result;
    } else if (action === "vote") {
       if(params.data.targetEmail === userEmail) {
          lock.releaseLock();
          return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Regra de Segurança: Não podes votar em ti próprio." }))
             .setMimeType(ContentService.MimeType.JSON);
       }
       const result = registerVote(userEmail, params.data);
       lock.releaseLock();
       return result;
    } else if (action === "get_my_votes") {
       const result = getMyVotes(userEmail);
       lock.releaseLock();
       return result;
    } else if (action === "register_game") {
       const result = registerGame(params.data);
       lock.releaseLock();
       return result;
    }
    
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Endpoint GET - Lê dados (para a tabela e perfil)
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "get_users") {
       const sheet = getSpreadsheet().getSheetByName("Users");
       const data = sheet.getDataRange().getValues();
       
       if (data.length <= 1) {
         return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
           .setMimeType(ContentService.MimeType.JSON);
       }

       const headers = data[0];
       const users = [];
       for(let i=1; i<data.length; i++) {
          let user = {};
          for(let j=0; j<headers.length; j++) {
             user[headers[j]] = data[i][j];
          }
          users.push(user);
       }
       
       // Ler todos os votos para calcular a média de cada jogador
       const votesSheet = getSpreadsheet().getSheetByName("Votes");
       const votesData = votesSheet.getDataRange().getValues();
       
       // Calcular médias
       users.forEach(u => {
          let count = 0; let atq = 0; let def = 0; let fis = 0; let pas = 0; let gr = 0; let fp = 0;
          for(let v=1; v<votesData.length; v++) {
             if(votesData[v][1] === u.Email) { // Target_Email está no index 1
                count++;
                atq += Number(votesData[v][2]);
                def += Number(votesData[v][3]);
                fis += Number(votesData[v][4]);
                pas += Number(votesData[v][5]);
                let grVal = Number(votesData[v][7]);
                gr += (isNaN(grVal) || grVal === 0) ? 50 : grVal; // Votos antigos sem GR ficam com base de 50
                let fpVal = Number(votesData[v][8]);
                fp += (isNaN(fpVal) || fpVal === 0) ? 50 : fpVal; // Votos antigos sem FP ficam com base de 50
             }
          }
          if(count > 0) {
             u.Ataque = Math.round(atq/count);
             u.Defesa = Math.round(def/count);
             u.Fisico = Math.round(fis/count);
             u.Passe = Math.round(pas/count);
             u.Guarda_Redes = Math.round(gr/count);
             u.Fairplay = Math.round(fp/count);
             u.Overall = Math.round((u.Ataque + u.Defesa + u.Fisico + u.Passe + u.Guarda_Redes + u.Fairplay) / 6);
             u.TotalVotos = count;
          } else {
             u.Ataque = 0; u.Defesa = 0; u.Fisico = 0; u.Passe = 0; u.Guarda_Redes = 0; u.Fairplay = 0; u.Overall = 0;
             u.TotalVotos = 0;
          }
       });
       
       return ContentService.createTextOutput(JSON.stringify({ success: true, data: users }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_games") {
       const sheet = getSpreadsheet().getSheetByName("Games");
       const data = sheet.getDataRange().getValues();
       
       if (data.length <= 1) {
         return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
           .setMimeType(ContentService.MimeType.JSON);
       }

       const headers = data[0];
       const games = [];
       for(let i=1; i<data.length; i++) {
          let game = {};
          for(let j=0; j<headers.length; j++) {
             game[headers[j]] = data[i][j];
          }
          try {
             game.Equipa_A = JSON.parse(game.Equipa_A);
             game.Equipa_B = JSON.parse(game.Equipa_B);
          } catch(e) {}
          games.push(game);
       }
       
       games.reverse(); // Mais recentes primeiro
       
       return ContentService.createTextOutput(JSON.stringify({ success: true, data: games }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid GET action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
     return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function registerUser(email, name, picture) {
   const sheet = getSpreadsheet().getSheetByName("Users");
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (data[i][1] === email) { // Verifica se já existe
       // Atualiza a foto caso tenha mudado
       sheet.getRange(i+1, 8).setValue(picture || "");
       return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User exists, updated avatar." }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   // Add new user: Nome, Email, Vitorias, Empates, Derrotas, Pontos, Jogos, Avatar
   sheet.appendRow([name, email, 0, 0, 0, 0, 0, picture || ""]);
   return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User created" }))
     .setMimeType(ContentService.MimeType.JSON);
}

function registerVote(voterEmail, data) {
    const sheet = getSpreadsheet().getSheetByName("Votes");
    const rows = sheet.getDataRange().getValues();
    
    // Verificar se o utilizador já votou nesta pessoa
    for (let i = 1; i < rows.length; i++) {
       if (rows[i][0] === voterEmail && rows[i][1] === data.targetEmail) {
          // Atualiza o voto existente
          sheet.getRange(i + 1, 3).setValue(data.ataque);
          sheet.getRange(i + 1, 4).setValue(data.defesa);
          sheet.getRange(i + 1, 5).setValue(data.fisico);
          sheet.getRange(i + 1, 6).setValue(data.passe);
          sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
          sheet.getRange(i + 1, 8).setValue(data.guardaRedes);
          sheet.getRange(i + 1, 9).setValue(data.fairplay);
          
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Voto atualizado com sucesso!" }))
            .setMimeType(ContentService.MimeType.JSON);
       }
    }
    
    // Se não encontrou, regista um novo
    sheet.appendRow([voterEmail, data.targetEmail, data.ataque, data.defesa, data.fisico, data.passe, new Date().toISOString(), data.guardaRedes, data.fairplay]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Voto registado com sucesso!" }))
      .setMimeType(ContentService.MimeType.JSON);
}

function getMyVotes(email) {
    const sheet = getSpreadsheet().getSheetByName("Votes");
    const data = sheet.getDataRange().getValues();
    const myVotes = {};
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email) {
            let grVal = Number(data[i][7]);
            let fpVal = Number(data[i][8]);
            myVotes[data[i][1]] = {
                ataque: Number(data[i][2]),
                defesa: Number(data[i][3]),
                fisico: Number(data[i][4]),
                passe: Number(data[i][5]),
                guardaRedes: (isNaN(grVal) || grVal === 0) ? 50 : grVal,
                fairplay: (isNaN(fpVal) || fpVal === 0) ? 50 : fpVal
            };
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: myVotes }))
      .setMimeType(ContentService.MimeType.JSON);
}

function registerGame(data) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const gameId = Utilities.getUuid();
    
    const eqA = JSON.stringify(data.equipaA);
    const eqB = JSON.stringify(data.equipaB);

    // Columns: GameID, Data, ResA, ResB, EquipaA, EquipaB
    sheet.appendRow([gameId, new Date().toISOString(), data.resA, data.resB, eqA, eqB]);
    
    // Update Users stats
    updateUserStats(data.equipaA, data.equipaB, data.resA, data.resB);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Jogo registado e pontos atribuídos!" }))
      .setMimeType(ContentService.MimeType.JSON);
}

function updateUserStats(equipaA, equipaB, resA, resB) {
    const sheet = getSpreadsheet().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    
    let ptsA = 0; let ptsB = 0;
    let winA = 0; let winB = 0;
    let draw = 0; let lossA = 0; let lossB = 0;
    
    if (resA > resB) { ptsA = 3; winA = 1; lossB = 1; }
    else if (resB > resA) { ptsB = 3; winB = 1; lossA = 1; }
    else { ptsA = 1; ptsB = 1; draw = 1; }
    
    for (let i = 1; i < data.length; i++) {
       const email = data[i][1];
       if (equipaA.includes(email)) {
          sheet.getRange(i+1, 3).setValue(Number(data[i][2]) + winA); // Vitórias
          sheet.getRange(i+1, 4).setValue(Number(data[i][3]) + draw); // Empates
          sheet.getRange(i+1, 5).setValue(Number(data[i][4]) + lossA); // Derrotas
          sheet.getRange(i+1, 6).setValue(Number(data[i][5]) + ptsA); // Pontos Totais
          sheet.getRange(i+1, 7).setValue(Number(data[i][6]) + 1); // Jogos
       } else if (equipaB.includes(email)) {
          sheet.getRange(i+1, 3).setValue(Number(data[i][2]) + winB);
          sheet.getRange(i+1, 4).setValue(Number(data[i][3]) + draw);
          sheet.getRange(i+1, 5).setValue(Number(data[i][4]) + lossB);
          sheet.getRange(i+1, 6).setValue(Number(data[i][5]) + ptsB);
          sheet.getRange(i+1, 7).setValue(Number(data[i][6]) + 1);
       }
    }
}
