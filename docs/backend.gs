const SPREADSHEET_ID = "1Fuw9J3bvihY_daAr__NtVPmMxZHUL8WmkZRi6WDYlLU";

// Função utilitária para obter a folha de cálculo
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Configuração Inicial e Migração de Colunas (Executar se necessário)
function setupSheets() {
  const ss = getSpreadsheet();
  
  const setupSheet = (name, headers) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d9d9d9");
    } else {
      // Assegurar cabeçalhos atualizados sem apagar dados existentes
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      if (currentHeaders.length < headers.length) {
        for (let i = currentHeaders.length; i < headers.length; i++) {
          sheet.getRange(1, i + 1).setValue(headers[i]).setFontWeight("bold").setBackground("#d9d9d9");
        }
      }
    }
  };

  setupSheet("Users", ["Nome", "Email", "Vitorias", "Empates", "Derrotas", "Pontos_Totais", "Jogos_Jogados", "Avatar", "IsGuest", "CreatedBy"]);
  setupSheet("Votes", ["Voter_Email", "Target_Email", "Ataque", "Defesa", "Fisico", "Passe", "Timestamp", "Guarda_Redes", "Fairplay"]);
  setupSheet("Games", ["GameID", "Data", "Resultado_A", "Resultado_B", "Equipa_A", "Equipa_B", "SessionID", "SessionType", "VideoFileId", "VideoDownloadUrl", "VideoExpiryDate", "RoundNumber", "FieldCost", "Fee"]);
  setupSheet("Expenses", ["ExpenseID", "Data", "Descricao", "Valor", "FotoUrl", "RegistadoPor", "ValorCaixa", "ContribuicoesDiretas"]);
}

// Obter ou criar a pasta no Google Drive do administrador
function getOrCreateVideoFolder() {
  const folderName = "TikiTasco_Videos";
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

// Validação do Token do Google Identity Services
function validateToken(token) {
  if (!token) return null;
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(response.getContentText());
    if (json.email) {
      return json;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Endpoint POST - Recebe ações do frontend
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Servidor ocupado com demasiados pedidos. Tenta novamente em segundos." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const token = params.token;
    
    // Validar utilizador
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
    } else if (action === "create_guest") {
       const result = createGuestPlayer(params.name, userEmail);
       lock.releaseLock();
       return result;
    } else if (action === "claim_ghost_player") {
       const result = claimGhostPlayer(userEmail, userInfo.name, userInfo.picture, params.ghostEmail);
       lock.releaseLock();
       return result;
    } else if (action === "initiate_video_upload") {
       const result = initiateVideoUpload(params);
       lock.releaseLock();
       return result;
    } else if (action === "finalize_video_upload") {
       const result = finalizeVideoUpload(params.fileId);
       lock.releaseLock();
       return result;
    } else if (action === "vote") {
       if (params.data.targetEmail === userEmail) {
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
       const result = registerGame(params);
       lock.releaseLock();
       return result;
    } else if (action === "register_session") {
       const result = registerSession(params);
       lock.releaseLock();
       return result;
    } else if (action === "edit_game") {
       const result = editGame(params);
       lock.releaseLock();
       return result;
    } else if (action === "delete_game") {
       const result = deleteGame(params);
       lock.releaseLock();
       return result;
    } else if (action === "update_avatar") {
       const result = updateAvatar(userEmail, params.base64);
       lock.releaseLock();
       return result;
    } else if (action === "update_profile") {
       const result = updateProfile(userEmail, params.name, params.avatar);
       lock.releaseLock();
       return result;
    } else if (action === "register_expense") {
       const result = registerExpense(params.date, params.description, params.amount, params.photoUrl, userEmail, params.boxAmount, params.directContributions);
       lock.releaseLock();
       return result;
    } else if (action === "edit_expense") {
       const result = editExpense(params.expenseId, params.date, params.description, params.amount, params.photoUrl, params.boxAmount, params.directContributions);
       lock.releaseLock();
       return result;
    } else if (action === "upload_receipt") {
       const result = uploadReceipt(params.base64, params.filename);
       lock.releaseLock();
       return result;
    }
    
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Endpoint GET - Lê dados para tabela, histórico e perfis
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "get_expenses") {
       return getExpenses();
    } else if (action === "get_users") {
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
          user.IsGuest = (user.IsGuest === true || String(user.IsGuest).toUpperCase() === "TRUE" || (user.Email && user.Email.startsWith("guest_")));
          users.push(user);
       }
       
       // Ler votos para calcular médias
       const votesSheet = getSpreadsheet().getSheetByName("Votes");
       const votesData = votesSheet.getDataRange().getValues();
       
       users.forEach(u => {
          let count = 0; let atq = 0; let def = 0; let fis = 0; let pas = 0; let gr = 0; let fp = 0;
          for(let v=1; v<votesData.length; v++) {
             if(votesData[v][1] === u.Email) {
                count++;
                atq += Number(votesData[v][2]);
                def += Number(votesData[v][3]);
                fis += Number(votesData[v][4]);
                pas += Number(votesData[v][5]);
                let grVal = Number(votesData[v][7]);
                gr += (isNaN(grVal) || grVal === 0) ? 50 : grVal;
                let fpVal = Number(votesData[v][8]);
                fp += (isNaN(fpVal) || fpVal === 0) ? 50 : fpVal;
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
       // Executa limpeza automática de vídeos com mais de 30 dias
       try { cleanupExpiredVideos(); } catch(e) {}

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

// Iniciar sessão de upload resumable diretamente no Google Drive
function initiateVideoUpload(params) {
  try {
    const folder = getOrCreateVideoFolder();
    const folderId = folder.getId();
    const fileName = (params.fileName || "Jogo_TikiTasco_" + new Date().getTime() + ".mp4");
    const mimeType = params.mimeType || "video/mp4";
    const fileSize = params.fileSize;
    const clientOrigin = params.origin || "https://fmnggit.github.io";

    const metadata = {
      name: fileName,
      parents: [folderId]
    };

    const token = ScriptApp.getOAuthToken();
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    
    const reqHeaders = {
      "Authorization": "Bearer " + token,
      "X-Upload-Content-Type": mimeType,
      "X-Upload-Content-Length": String(fileSize),
      "Origin": clientOrigin
    };

    const options = {
      method: "POST",
      contentType: "application/json; charset=UTF-8",
      headers: reqHeaders,
      payload: JSON.stringify(metadata),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const respHeaders = response.getAllHeaders();
    const uploadUrl = respHeaders["Location"] || respHeaders["location"];

    if (!uploadUrl) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: "Não foi possível obter URL de upload do Google Drive: " + response.getContentText() 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      uploadUrl: uploadUrl 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Finalizar upload: ativa partilha pública para leitura e devolve links
function finalizeVideoUpload(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const downloadUrl = file.getDownloadUrl() || file.getUrl();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      fileId: fileId, 
      downloadUrl: downloadUrl,
      expiryDate: expiryDate
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Limpeza automática de vídeos após 30 dias
function cleanupExpiredVideos() {
  const sheet = getSpreadsheet().getSheetByName("Games");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  
  const headers = data[0];
  const fileIdIndex = headers.indexOf("VideoFileId");
  const expiryIndex = headers.indexOf("VideoExpiryDate");
  const urlIndex = headers.indexOf("VideoDownloadUrl");
  
  if (fileIdIndex === -1 || expiryIndex === -1) return 0;
  
  const now = new Date();
  let cleanedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const fileId = data[i][fileIdIndex];
    const expiryStr = data[i][expiryIndex];
    
    if (fileId && expiryStr) {
      const expiryDate = new Date(expiryStr);
      if (now > expiryDate) {
        try {
          DriveApp.getFileById(fileId).setTrashed(true);
        } catch(err) {}
        sheet.getRange(i + 1, fileIdIndex + 1).setValue("");
        if (urlIndex !== -1) {
          sheet.getRange(i + 1, urlIndex + 1).setValue("EXPIRED");
        }
        cleanedCount++;
      }
    }
  }
  return cleanedCount;
}

// Criar jogador convidado/fantasma
function createGuestPlayer(name, creatorEmail) {
  if (!name || name.trim() === "") {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Nome inválido." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheet = getSpreadsheet().getSheetByName("Users");
  const guestEmail = "guest_" + Utilities.getUuid().substring(0, 8) + "@convidado.tikitasco";
  
  // Nome, Email, V, E, D, Pts, Jogos, Avatar, IsGuest, CreatedBy
  sheet.appendRow([name.trim(), guestEmail, 0, 0, 0, 0, 0, "", true, creatorEmail || ""]);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    user: {
      Nome: name.trim(),
      Email: guestEmail,
      Vitorias: 0,
      Empates: 0,
      Derrotas: 0,
      Pontos_Totais: 0,
      Jogos_Jogados: 0,
      Avatar: "",
      IsGuest: true
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

// Reivindicar perfil de convidado: funde todo o histórico com a conta Google real
function claimGhostPlayer(realEmail, realName, realPicture, ghostEmail) {
  if (!ghostEmail || !ghostEmail.startsWith("guest_")) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Email de convidado inválido." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = getSpreadsheet();
  const usersSheet = ss.getSheetByName("Users");
  const gamesSheet = ss.getSheetByName("Games");
  const votesSheet = ss.getSheetByName("Votes");
  
  // 1. Atualizar jogos na folha Games
  const gamesData = gamesSheet.getDataRange().getValues();
  for (let g = 1; g < gamesData.length; g++) {
    let modified = false;
    let eqA = []; let eqB = [];
    try { eqA = JSON.parse(gamesData[g][4]); } catch(e){}
    try { eqB = JSON.parse(gamesData[g][5]); } catch(e){}
    
    if (eqA.includes(ghostEmail)) {
      eqA = eqA.map(e => e === ghostEmail ? realEmail : e);
      modified = true;
    }
    if (eqB.includes(ghostEmail)) {
      eqB = eqB.map(e => e === ghostEmail ? realEmail : e);
      modified = true;
    }
    
    if (modified) {
      gamesSheet.getRange(g + 1, 5).setValue(JSON.stringify(eqA));
      gamesSheet.getRange(g + 1, 6).setValue(JSON.stringify(eqB));
    }
  }
  
  // 2. Atualizar votos na folha Votes
  const votesData = votesSheet.getDataRange().getValues();
  for (let v = 1; v < votesData.length; v++) {
    if (votesData[v][0] === ghostEmail) {
      votesSheet.getRange(v + 1, 1).setValue(realEmail);
    }
    if (votesData[v][1] === ghostEmail) {
      votesSheet.getRange(v + 1, 2).setValue(realEmail);
    }
  }
  
  // 3. Assegurar que o utilizador real existe na folha Users e remover o fantasma
  const usersData = usersSheet.getDataRange().getValues();
  let ghostRow = -1;
  let realUserRow = -1;
  
  for (let u = 1; u < usersData.length; u++) {
    if (usersData[u][1] === ghostEmail) {
      ghostRow = u + 1;
    }
    if (usersData[u][1] === realEmail) {
      realUserRow = u + 1;
    }
  }
  
  if (ghostRow !== -1) {
    usersSheet.deleteRow(ghostRow);
  }
  
  // Se o utilizador real ainda não existia, cria-o
  if (realUserRow === -1) {
    usersSheet.appendRow([realName || "Jogador", realEmail, 0, 0, 0, 0, 0, realPicture || "", false, ""]);
  }
  
  // 4. Recalcular todas as estatísticas para sincronizar tudo
  recalculateAllUserStats();
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: "Perfil de convidado reivindicado com sucesso! Todo o teu histórico foi transferido." 
  })).setMimeType(ContentService.MimeType.JSON);
}

function registerUser(email, name, picture) {
   const sheet = getSpreadsheet().getSheetByName("Users");
   const data = sheet.getDataRange().getValues();
   for (let i = 1; i < data.length; i++) {
     if (data[i][1] === email) {
       const currentAvatar = data[i][7];
       if (!currentAvatar || currentAvatar.includes("googleusercontent.com")) {
           if (currentAvatar !== picture) {
               sheet.getRange(i+1, 8).setValue(picture || "");
           }
       }
       return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User exists, updated avatar se aplicável." }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   // Add new user
   sheet.appendRow([name, email, 0, 0, 0, 0, 0, picture || "", false, ""]);
   return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User created" }))
     .setMimeType(ContentService.MimeType.JSON);
}

function updateAvatar(email, base64) {
    const sheet = getSpreadsheet().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === email) {
            sheet.getRange(i + 1, 8).setValue(base64 || "");
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Avatar atualizado com sucesso!" }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Utilizador não encontrado." }))
        .setMimeType(ContentService.MimeType.JSON);
}

function updateProfile(email, name, avatar) {
    const sheet = getSpreadsheet().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === email) {
            if (name && typeof name === "string" && name.trim().length > 0) {
                sheet.getRange(i + 1, 1).setValue(name.trim());
            }
            if (avatar !== undefined && avatar !== null) {
                sheet.getRange(i + 1, 8).setValue(avatar);
            }
            return ContentService.createTextOutput(JSON.stringify({ 
                success: true, 
                message: "Perfil atualizado com sucesso!",
                name: name ? name.trim() : data[i][0],
                avatar: avatar !== undefined && avatar !== null ? avatar : data[i][7]
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Utilizador não encontrado." }))
        .setMimeType(ContentService.MimeType.JSON);
}

function registerVote(voterEmail, data) {
    const sheet = getSpreadsheet().getSheetByName("Votes");
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
       if (rows[i][0] === voterEmail && rows[i][1] === data.targetEmail) {
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

// Registo de jogo único padrão
function registerGame(params) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const gameId = Utilities.getUuid();
    
    const eqA = JSON.stringify(params.equipaA || []);
    const eqB = JSON.stringify(params.equipaB || []);
    const gameDate = params.date ? new Date(params.date).toISOString() : new Date().toISOString();
    const sessionId = params.sessionId || "";
    const sessionType = params.sessionType || "standard";
    const videoFileId = params.videoFileId || "";
    const videoDownloadUrl = params.videoDownloadUrl || "";
    const videoExpiryDate = params.videoExpiryDate || (videoFileId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : "");
    const roundNumber = params.roundNumber || 1;
    const fieldCost = params.fieldCost || 0;
    const fee = params.fee || 0;

    // Colunas: GameID, Data, ResA, ResB, EquipaA, EquipaB, SessionID, SessionType, VideoFileId, VideoDownloadUrl, VideoExpiryDate, RoundNumber, FieldCost, Fee
    sheet.appendRow([gameId, gameDate, params.resA, params.resB, eqA, eqB, sessionId, sessionType, videoFileId, videoDownloadUrl, videoExpiryDate, roundNumber, fieldCost, fee]);
    
    recalculateAllUserStats();
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Jogo registado com sucesso!", gameId: gameId }))
      .setMimeType(ContentService.MimeType.JSON);
}

// Registo de sessão multi-jogo (Rei da Pista ou Rotação Dinâmica)
function registerSession(params) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const sessionId = Utilities.getUuid();
    const sessionType = params.sessionType || "reidapista";
    const gameDate = params.date ? new Date(params.date).toISOString() : new Date().toISOString();
    const videoFileId = params.videoFileId || "";
    const videoDownloadUrl = params.videoDownloadUrl || "";
    const videoExpiryDate = params.videoExpiryDate || (videoFileId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : "");
    const rounds = params.rounds || [];

    if (rounds.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Nenhuma ronda/jogo fornecido para a sessão." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    rounds.forEach((round, idx) => {
      const gameId = Utilities.getUuid();
      const eqA = JSON.stringify(round.equipaA || []);
      const eqB = JSON.stringify(round.equipaB || []);
      sheet.appendRow([
        gameId, 
        gameDate, 
        round.resA, 
        round.resB, 
        eqA, 
        eqB, 
        sessionId, 
        sessionType, 
        videoFileId, 
        videoDownloadUrl, 
        videoExpiryDate, 
        idx + 1
      ]);
    });

    recalculateAllUserStats();

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Sessão com " + rounds.length + " mini-jogos registada com sucesso!",
      sessionId: sessionId
    })).setMimeType(ContentService.MimeType.JSON);
}

function editGame(params) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const data = sheet.getDataRange().getValues();
    const gameId = params.gameId;
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === gameId) {
            rowIndex = i + 1;
            break;
        }
    }
    
    if (rowIndex === -1) {
       return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Jogo não encontrado!" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const gameDate = params.date ? new Date(params.date).toISOString() : new Date().toISOString();
    sheet.getRange(rowIndex, 2).setValue(gameDate);
    sheet.getRange(rowIndex, 3).setValue(params.resA);
    sheet.getRange(rowIndex, 4).setValue(params.resB);
    sheet.getRange(rowIndex, 5).setValue(JSON.stringify(params.equipaA));
    sheet.getRange(rowIndex, 6).setValue(JSON.stringify(params.equipaB));
    
    // Atualizar vídeo se fornecido
    if (params.videoFileId !== undefined) {
      sheet.getRange(rowIndex, 9).setValue(params.videoFileId);
      sheet.getRange(rowIndex, 10).setValue(params.videoDownloadUrl || "");
      sheet.getRange(rowIndex, 11).setValue(params.videoExpiryDate || "");
    }
    
    recalculateAllUserStats();
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Jogo atualizado com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
}

function deleteGame(params) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const data = sheet.getDataRange().getValues();
    const gameId = params.gameId;
    
    let rowIndex = -1;
    let videoFileId = "";
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === gameId) {
            rowIndex = i + 1;
            videoFileId = data[i][8] || "";
            break;
        }
    }
    
    if (rowIndex === -1) {
       return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Jogo não encontrado!" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Apagar vídeo associado da Drive se existir para libertar espaço
    if (videoFileId) {
      try { DriveApp.getFileById(videoFileId).setTrashed(true); } catch(e) {}
    }

    sheet.deleteRow(rowIndex);
    recalculateAllUserStats();
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Jogo apagado com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
}

// Otimizado: Recálculo em lote usando setValues (5x a 10x mais rápido)
function recalculateAllUserStats() {
    const usersSheet = getSpreadsheet().getSheetByName("Users");
    const gamesSheet = getSpreadsheet().getSheetByName("Games");
    
    const usersData = usersSheet.getDataRange().getValues();
    const gamesData = gamesSheet.getDataRange().getValues();
    
    if (usersData.length <= 1) return;

    let userStats = {};
    for (let i = 1; i < usersData.length; i++) {
        userStats[usersData[i][1]] = { vitorias: 0, empates: 0, derrotas: 0, pontos: 0, jogos: 0, index: i - 1 };
    }
    
    for (let g = 1; g < gamesData.length; g++) {
        const resA = Number(gamesData[g][2]);
        const resB = Number(gamesData[g][3]);
        let equipaA = []; let equipaB = [];
        try { equipaA = JSON.parse(gamesData[g][4]); } catch(e){}
        try { equipaB = JSON.parse(gamesData[g][5]); } catch(e){}
        
        let ptsA = 0; let ptsB = 0; let winA = 0; let winB = 0; let draw = 0; let lossA = 0; let lossB = 0;
        if (resA > resB) { ptsA = 3; winA = 1; lossB = 1; }
        else if (resB > resA) { ptsB = 3; winB = 1; lossA = 1; }
        else { ptsA = 1; ptsB = 1; draw = 1; }
        
        equipaA.forEach(email => {
            if (userStats[email]) {
                userStats[email].vitorias += winA; 
                userStats[email].empates += draw; 
                userStats[email].derrotas += lossA;
                userStats[email].pontos += ptsA; 
                userStats[email].jogos += 1;
            }
        });
        equipaB.forEach(email => {
            if (userStats[email]) {
                userStats[email].vitorias += winB; 
                userStats[email].empates += draw; 
                userStats[email].derrotas += lossB;
                userStats[email].pontos += ptsB; 
                userStats[email].jogos += 1;
            }
        });
    }
    
    // Preparar matriz em lote para as colunas: Vitorias, Empates, Derrotas, Pontos_Totais, Jogos_Jogados
    const updateMatrix = [];
    for (let i = 1; i < usersData.length; i++) {
        const email = usersData[i][1];
        const s = userStats[email] || { vitorias: 0, empates: 0, derrotas: 0, pontos: 0, jogos: 0 };
        updateMatrix.push([s.vitorias, s.empates, s.derrotas, s.pontos, s.jogos]);
    }

    if (updateMatrix.length > 0) {
      usersSheet.getRange(2, 3, updateMatrix.length, 5).setValues(updateMatrix);
    }
}

// ==========================================
// NOVAS FUNÇÕES PARA A TESOURARIA
// ==========================================

// Função para obter despesas
function getExpenses() {
  const sheet = getSpreadsheet().getSheetByName("Expenses");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
       .setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
       .setMimeType(ContentService.MimeType.JSON);
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    let expense = {};
    for (let j = 0; j < headers.length; j++) {
      expense[headers[j]] = data[i][j];
    }
    result.push(expense);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
       .setMimeType(ContentService.MimeType.JSON);
}

// Função para registar despesa
function registerExpense(date, description, amount, photoUrl, registeredBy, boxAmount, directContributions) {
  let sheet = getSpreadsheet().getSheetByName("Expenses");
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet("Expenses");
    sheet.appendRow(["ExpenseID", "Data", "Descricao", "Valor", "FotoUrl", "RegistadoPor", "ValorCaixa", "ContribuicoesDiretas"]);
  }
  
  const expenseId = "exp_" + new Date().getTime();
  const directContributionsStr = directContributions ? JSON.stringify(directContributions) : "[]";
  
  sheet.appendRow([expenseId, date, description, amount, photoUrl || "", registeredBy, boxAmount, directContributionsStr]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Despesa registada com sucesso" }))
       .setMimeType(ContentService.MimeType.JSON);
}

// Função para editar despesa
function editExpense(expenseId, date, description, amount, photoUrl, boxAmount, directContributions) {
  let sheet = getSpreadsheet().getSheetByName("Expenses");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tabela não encontrada." })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  // Assume ExpenseID is in column A (index 0)
  // Headers: "ExpenseID", "Data", "Descricao", "Valor", "FotoUrl", "RegistadoPor", "ValorCaixa", "ContribuicoesDiretas"
  const headers = data[0];
  const dateIdx = headers.indexOf("Data");
  const descIdx = headers.indexOf("Descricao");
  const valIdx = headers.indexOf("Valor");
  const photoIdx = headers.indexOf("FotoUrl");
  const boxValIdx = headers.indexOf("ValorCaixa");
  const contribIdx = headers.indexOf("ContribuicoesDiretas");

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === expenseId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Despesa não encontrada." }))
       .setMimeType(ContentService.MimeType.JSON);
  }

  const directContributionsStr = directContributions ? JSON.stringify(directContributions) : "[]";

  sheet.getRange(rowIndex, dateIdx + 1).setValue(date);
  sheet.getRange(rowIndex, descIdx + 1).setValue(description);
  sheet.getRange(rowIndex, valIdx + 1).setValue(amount);
  sheet.getRange(rowIndex, photoIdx + 1).setValue(photoUrl || "");
  sheet.getRange(rowIndex, boxValIdx + 1).setValue(boxAmount);
  sheet.getRange(rowIndex, contribIdx + 1).setValue(directContributionsStr);

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Despesa atualizada com sucesso" }))
       .setMimeType(ContentService.MimeType.JSON);
}

// Função para fazer upload da fatura
function uploadReceipt(base64, filename) {
  try {
    const folder = getOrCreateVideoFolder();
    
    // Remover o prefixo (ex: data:image/png;base64,)
    const base64Data = base64.split(",")[1] || base64;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/jpeg", filename || "fatura.jpg");
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // Permite visualização
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, fileUrl: file.getUrl() }))
       .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
       .setMimeType(ContentService.MimeType.JSON);
  }
}

