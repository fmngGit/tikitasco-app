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
  setupSheet("Games", ["GameID", "Data", "Resultado_A", "Resultado_B", "Equipa_A", "Equipa_B", "SessionID", "SessionType", "VideoFileId", "VideoDownloadUrl", "VideoExpiryDate", "RoundNumber", "FieldCost", "Fee", "LocationID"]);
  setupSheet("Expenses", ["ExpenseID", "Data", "Descricao", "Valor", "FotoUrl", "RegistadoPor", "ValorCaixa", "ContribuicoesDiretas"]);
  setupSheet("Locations", ["LocationID", "Nome", "Morada", "PrecoHora", "PrecoBola", "PrecoColetes", "TipoPiso", "Indoor", "Balnearios", "TipoFutebol", "FotosUrl", "RegistadoPor", "Telefone", "Email", "Notas"]);
  setupSheet("Polls", ["TargetWeek", "UserEmail", "Monday", "Tuesday", "Wednesday", "Thursday", "Locations", "Timestamp"]);
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

// ==========================================
// UTILIDADES DE VALIDAÇÃO (Fase 2.3)
// ==========================================

function validateNumber(val, min, max, fallback) {
  const num = Number(val);
  if (isNaN(num)) return fallback !== undefined ? fallback : 0;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}

function validateString(val, maxLength) {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  return maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

function validateEmail(val) {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim().toLowerCase();
  // Aceita emails normais e emails de convidados do TikiTasco
  if (trimmed.includes('@') || trimmed.startsWith('guest_')) return trimmed;
  return '';
}

function validateEmailArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(e => validateEmail(e)).filter(e => e !== '');
}

// ==========================================
// ENDPOINT POST - Lock granular (Fase 1.3)
// ==========================================

// Operações que não modificam dados — não precisam de lock
var READ_ONLY_ACTIONS = { "get_my_votes": true };

function doPost(e) {
  var lock = null;
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var token = params.token;
    
    // Validar utilizador ANTES de adquirir o lock (evita bloquear durante a chamada HTTP)
    var userInfo = validateToken(token);
    if (!userInfo || !userInfo.email) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid or expired token. Please login again." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var userEmail = userInfo.email;

    // Operações read-only não precisam de lock
    if (READ_ONLY_ACTIONS[action]) {
      return dispatchAction(action, userEmail, userInfo, params);
    }

    // Adquirir lock apenas para operações de escrita
    lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
    } catch (lockErr) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Servidor ocupado. Tenta novamente em alguns segundos." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var result = dispatchAction(action, userEmail, userInfo, params);
    lock.releaseLock();
    return result;

  } catch (error) {
    if (lock) { try { lock.releaseLock(); } catch(e) {} }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Dispatcher centralizado — separa routing de lock management
function dispatchAction(action, userEmail, userInfo, params) {
  if (action === "register_user") {
    return registerUser(userEmail, userInfo.name, userInfo.picture);
  } else if (action === "create_guest") {
    return createGuestPlayer(validateString(params.name, 100), userEmail);
  } else if (action === "claim_ghost_player") {
    return claimGhostPlayer(userEmail, userInfo.name, userInfo.picture, params.ghostEmail);
  } else if (action === "initiate_video_upload") {
    return initiateVideoUpload(params);
  } else if (action === "finalize_video_upload") {
    return finalizeVideoUpload(params.fileId);
  } else if (action === "vote") {
    if (params.data.targetEmail === userEmail) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Regra de Segurança: Não podes votar em ti próprio." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // Validar ranges dos atributos (1-99)
    params.data.ataque = validateNumber(params.data.ataque, 1, 99, 50);
    params.data.defesa = validateNumber(params.data.defesa, 1, 99, 50);
    params.data.fisico = validateNumber(params.data.fisico, 1, 99, 50);
    params.data.passe = validateNumber(params.data.passe, 1, 99, 50);
    params.data.guardaRedes = validateNumber(params.data.guardaRedes, 1, 99, 50);
    params.data.fairplay = validateNumber(params.data.fairplay, 1, 99, 50);
    return registerVote(userEmail, params.data);
  } else if (action === "get_my_votes") {
    return getMyVotes(userEmail);
  } else if (action === "register_game") {
    // Validar inputs numéricos
    params.resA = validateNumber(params.resA, 0, 99, 0);
    params.resB = validateNumber(params.resB, 0, 99, 0);
    params.equipaA = validateEmailArray(params.equipaA);
    params.equipaB = validateEmailArray(params.equipaB);
    params.fieldCost = validateNumber(params.fieldCost, 0, 9999, 0);
    params.fee = validateNumber(params.fee, 0, 999, 0);
    return registerGame(params);
  } else if (action === "register_session") {
    if (params.rounds && Array.isArray(params.rounds)) {
      params.rounds = params.rounds.map(function(r) {
        return {
          resA: validateNumber(r.resA, 0, 99, 0),
          resB: validateNumber(r.resB, 0, 99, 0),
          equipaA: validateEmailArray(r.equipaA),
          equipaB: validateEmailArray(r.equipaB)
        };
      });
    }
    return registerSession(params);
  } else if (action === "edit_game") {
    params.resA = validateNumber(params.resA, 0, 99, 0);
    params.resB = validateNumber(params.resB, 0, 99, 0);
    params.equipaA = validateEmailArray(params.equipaA);
    params.equipaB = validateEmailArray(params.equipaB);
    return editGame(params);
  } else if (action === "delete_game") {
    return deleteGame(params);
  } else if (action === "delete_account") {
    return deleteAccount(userEmail);
  } else if (action === "update_avatar") {
    return updateAvatar(userEmail, params.base64);
  } else if (action === "update_profile") {
    return updateProfile(userEmail, params.name, params.avatar);
  } else if (action === "edit_guest_name") {
    return editGuestName(params.guestEmail, params.newName);
  } else if (action === "register_expense") {
    params.amount = validateNumber(params.amount, 0, 99999, 0);
    params.boxAmount = params.boxAmount !== undefined ? validateNumber(params.boxAmount, 0, 99999, params.amount) : params.amount;
    return registerExpense(params.date, validateString(params.description, 500), params.amount, params.photoUrl, userEmail, params.boxAmount, params.directContributions);
  } else if (action === "edit_expense") {
    params.amount = validateNumber(params.amount, 0, 99999, 0);
    params.boxAmount = params.boxAmount !== undefined ? validateNumber(params.boxAmount, 0, 99999, params.amount) : params.amount;
    return editExpense(params.expenseId, params.date, validateString(params.description, 500), params.amount, params.photoUrl, params.boxAmount, params.directContributions);
  } else if (action === "upload_receipt") {
    return uploadReceipt(params.base64, params.filename);
  } else if (action === "register_location") {
    return registerLocation(params);
  } else if (action === "edit_location") {
    return editLocation(params);
  } else if (action === "delete_location") {
    return deleteLocation(params.locationId);
  } else if (action === "submit_poll") {
    return submitPoll(userEmail, params);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action: " + action }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Endpoint GET - Lê dados para tabela, histórico e perfis
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "get_expenses") {
       return getExpenses();
    } else if (action === "get_locations") {
       return getLocations();
    } else if (action === "get_polls") {
       return getPolls(e.parameter.weekId);
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
       
       // Fase 2.1: Cálculo de médias com Map indexado — O(V + U) em vez de O(U × V)
       const votesSheet = getSpreadsheet().getSheetByName("Votes");
       const votesData = votesSheet.getDataRange().getValues();
       
       // Pré-indexar votos por target email numa única passagem
       const votesByTarget = {};
       for (let v = 1; v < votesData.length; v++) {
         const targetEmail = votesData[v][1];
         if (!votesByTarget[targetEmail]) {
           votesByTarget[targetEmail] = { count: 0, atq: 0, def: 0, fis: 0, pas: 0, gr: 0, fp: 0 };
         }
         const agg = votesByTarget[targetEmail];
         agg.count++;
         agg.atq += Number(votesData[v][2]);
         agg.def += Number(votesData[v][3]);
         agg.fis += Number(votesData[v][4]);
         agg.pas += Number(votesData[v][5]);
         const grVal = Number(votesData[v][7]);
         agg.gr += (isNaN(grVal) || grVal === 0) ? 50 : grVal;
         const fpVal = Number(votesData[v][8]);
         agg.fp += (isNaN(fpVal) || fpVal === 0) ? 50 : fpVal;
       }
       
       // Aplicar médias em O(1) por utilizador
       users.forEach(u => {
         const agg = votesByTarget[u.Email];
         if (agg && agg.count > 0) {
           u.Ataque = Math.round(agg.atq / agg.count);
           u.Defesa = Math.round(agg.def / agg.count);
           u.Fisico = Math.round(agg.fis / agg.count);
           u.Passe = Math.round(agg.pas / agg.count);
           u.Guarda_Redes = Math.round(agg.gr / agg.count);
           u.Fairplay = Math.round(agg.fp / agg.count);
           u.Overall = Math.round((u.Ataque + u.Defesa + u.Fisico + u.Passe + u.Guarda_Redes + u.Fairplay) / 6);
           u.TotalVotos = agg.count;
         } else {
           u.Ataque = 0; u.Defesa = 0; u.Fisico = 0; u.Passe = 0; u.Guarda_Redes = 0; u.Fairplay = 0; u.Overall = 0;
           u.TotalVotos = 0;
         }
       });
       
       return ContentService.createTextOutput(JSON.stringify({ success: true, data: users }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_games") {
       // Fase 1.8: Limpeza de vídeos movida para trigger temporizado (setupVideoCleanupTrigger)

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
// Fase 1.8: Já não é chamada dentro de doGet. Usar setupVideoCleanupTrigger() para agendar.
function cleanupExpiredVideos() {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch(e) { return 0; }
  
  try {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) { lock.releaseLock(); return 0; }
    
    const headers = data[0];
    const fileIdIndex = headers.indexOf("VideoFileId");
    const expiryIndex = headers.indexOf("VideoExpiryDate");
    const urlIndex = headers.indexOf("VideoDownloadUrl");
    
    if (fileIdIndex === -1 || expiryIndex === -1) { lock.releaseLock(); return 0; }
    
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
    lock.releaseLock();
    return cleanedCount;
  } catch(e) {
    lock.releaseLock();
    return 0;
  }
}

// Fase 1.8: Executar UMA VEZ para criar o trigger diário de limpeza de vídeos
function setupVideoCleanupTrigger() {
  // Remover triggers antigos desta função
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'cleanupExpiredVideos') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  // Criar trigger diário às 03:00
  ScriptApp.newTrigger('cleanupExpiredVideos')
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create();
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
// Fase 1.7: Batch setValues para Games e Votes em vez de setValue individual
function claimGhostPlayer(realEmail, realName, realPicture, ghostEmail) {
  if (!ghostEmail || !ghostEmail.startsWith("guest_")) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Email de convidado inválido." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = getSpreadsheet();
  const usersSheet = ss.getSheetByName("Users");
  const gamesSheet = ss.getSheetByName("Games");
  const votesSheet = ss.getSheetByName("Votes");
  
  // 1. Atualizar jogos na folha Games — batch
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
      // Batch: escrever ambas as colunas de equipas numa única chamada
      gamesSheet.getRange(g + 1, 5, 1, 2).setValues([[JSON.stringify(eqA), JSON.stringify(eqB)]]);
    }
  }
  
  // 2. Atualizar votos na folha Votes — batch por linha
  const votesData = votesSheet.getDataRange().getValues();
  for (let v = 1; v < votesData.length; v++) {
    const isVoter = votesData[v][0] === ghostEmail;
    const isTarget = votesData[v][1] === ghostEmail;
    if (isVoter || isTarget) {
      const newVoter = isVoter ? realEmail : votesData[v][0];
      const newTarget = isTarget ? realEmail : votesData[v][1];
      votesSheet.getRange(v + 1, 1, 1, 2).setValues([[newVoter, newTarget]]);
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
       return ContentService.createTextOutput(JSON.stringify({ success: true, isNewUser: false, message: "User exists, updated avatar se aplicável." }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   // Add new user
   sheet.appendRow([name, email, 0, 0, 0, 0, 0, picture || "", false, ""]);
   return ContentService.createTextOutput(JSON.stringify({ success: true, isNewUser: true, message: "User created" }))
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

// Fase 1.6: Batch setValues para updateProfile
function updateProfile(email, name, avatar) {
    const sheet = getSpreadsheet().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === email) {
            const newName = (name && typeof name === "string" && name.trim().length > 0) ? validateString(name, 100) : data[i][0];
            const newAvatar = (avatar !== undefined && avatar !== null) ? avatar : data[i][7];
            // Batch: Nome (col 1) e Avatar (col 8) — escrever ambos de uma vez usando a linha completa
            sheet.getRange(i + 1, 1).setValue(newName);
            sheet.getRange(i + 1, 8).setValue(newAvatar);
            return ContentService.createTextOutput(JSON.stringify({ 
                success: true, 
                message: "Perfil atualizado com sucesso!",
                name: newName,
                avatar: newAvatar
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Utilizador não encontrado." }))
        .setMimeType(ContentService.MimeType.JSON);
}

// Fase 1.1: Batch setValues para registerVote — 1 chamada em vez de 7
function registerVote(voterEmail, data) {
    const sheet = getSpreadsheet().getSheetByName("Votes");
    const rows = sheet.getDataRange().getValues();
    const timestamp = new Date().toISOString();
    
    // Colunas: Voter_Email(1), Target_Email(2), Ataque(3), Defesa(4), Fisico(5), Passe(6), Timestamp(7), Guarda_Redes(8), Fairplay(9)
    const rowValues = [data.ataque, data.defesa, data.fisico, data.passe, timestamp, data.guardaRedes, data.fairplay];
    
    for (let i = 1; i < rows.length; i++) {
       if (rows[i][0] === voterEmail && rows[i][1] === data.targetEmail) {
          // Batch: escrever colunas 3-9 numa única chamada
          sheet.getRange(i + 1, 3, 1, 7).setValues([rowValues]);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Voto atualizado com sucesso!" }))
            .setMimeType(ContentService.MimeType.JSON);
       }
    }
    
    sheet.appendRow([voterEmail, data.targetEmail, data.ataque, data.defesa, data.fisico, data.passe, timestamp, data.guardaRedes, data.fairplay]);
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
// Fase 2.2: Usa recálculo incremental em vez do completo
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
    const locationId = params.locationId || "";

    // Colunas: GameID, Data, ResA, ResB, EquipaA, EquipaB, SessionID, SessionType, VideoFileId, VideoDownloadUrl, VideoExpiryDate, RoundNumber, FieldCost, Fee, LocationID
    sheet.appendRow([gameId, gameDate, params.resA, params.resB, eqA, eqB, sessionId, sessionType, videoFileId, videoDownloadUrl, videoExpiryDate, roundNumber, fieldCost, fee, locationId]);
    
    // Fase 2.2: Recálculo incremental — apenas os jogadores do novo jogo
    const affectedEmails = Array.from(new Set([...(params.equipaA || []), ...(params.equipaB || [])]));
    updateStatsForPlayers(affectedEmails);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Jogo registado com sucesso!", gameId: gameId }))
      .setMimeType(ContentService.MimeType.JSON);
}

// Registo de sessão multi-jogo (Rei da Pista ou Rotação Dinâmica)
// Fase 2.2: Usa recálculo incremental
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

    const allAffectedEmails = new Set();

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
        idx + 1,
        0, 
        0,
        params.locationId || ""
      ]);
      (round.equipaA || []).forEach(e => allAffectedEmails.add(e));
      (round.equipaB || []).forEach(e => allAffectedEmails.add(e));
    });

    // Fase 2.2: Recálculo incremental — apenas jogadores da sessão
    updateStatsForPlayers(Array.from(allAffectedEmails));

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Sessão com " + rounds.length + " mini-jogos registada com sucesso!",
      sessionId: sessionId
    })).setMimeType(ContentService.MimeType.JSON);
}

// Fase 1.2 + 2.2: Batch setValues + recálculo incremental para editGame
function editGame(params) {
    const sheet = getSpreadsheet().getSheetByName("Games");
    const data = sheet.getDataRange().getValues();
    const gameId = params.gameId;
    
    let rowIndex = -1;
    let oldEquipaA = []; let oldEquipaB = [];
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === gameId) {
            rowIndex = i + 1;
            try { oldEquipaA = JSON.parse(data[i][4]); } catch(e) {}
            try { oldEquipaB = JSON.parse(data[i][5]); } catch(e) {}
            break;
        }
    }
    
    if (rowIndex === -1) {
       return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Jogo não encontrado!" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const gameDate = params.date ? new Date(params.date).toISOString() : new Date().toISOString();
    const eqA = JSON.stringify(params.equipaA);
    const eqB = JSON.stringify(params.equipaB);
    
    // Batch: escrever colunas 2-6 (Data, ResA, ResB, EqA, EqB) numa única chamada
    sheet.getRange(rowIndex, 2, 1, 5).setValues([[gameDate, params.resA, params.resB, eqA, eqB]]);
    
    // Atualizar vídeo se fornecido — batch colunas 9-11
    if (params.videoFileId !== undefined) {
      sheet.getRange(rowIndex, 9, 1, 3).setValues([[params.videoFileId, params.videoDownloadUrl || "", params.videoExpiryDate || ""]]);
    }
    
    if (params.locationId !== undefined) {
      const headers = data[0];
      const col = headers.indexOf("LocationID") + 1;
      if (col > 0) sheet.getRange(rowIndex, col).setValue(params.locationId);
    }
    
    // Fase 2.2: Recálculo incremental — apenas jogadores afetados (antigos + novos)
    const affectedEmails = Array.from(new Set([...oldEquipaA, ...oldEquipaB, ...params.equipaA, ...params.equipaB]));
    updateStatsForPlayers(affectedEmails);
    
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
// Mantido para uso manual e operações que afetam muitos jogadores (deleteGame, claimGhost)
function recalculateAllUserStats() {
    const ss = getSpreadsheet();
    const usersSheet = ss.getSheetByName("Users");
    const gamesSheet = ss.getSheetByName("Games");
    
    const usersData = usersSheet.getDataRange().getValues();
    const gamesData = gamesSheet.getDataRange().getValues();
    
    if (usersData.length <= 1) return;

    var userStats = {};
    for (let i = 1; i < usersData.length; i++) {
        userStats[usersData[i][1]] = { vitorias: 0, empates: 0, derrotas: 0, pontos: 0, jogos: 0 };
    }
    
    _processGamesIntoStats(gamesData, userStats);
    
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

// Fase 2.2: Recálculo incremental — apenas para os jogadores especificados
function updateStatsForPlayers(targetEmails) {
    if (!targetEmails || targetEmails.length === 0) return;
    
    const ss = getSpreadsheet();
    const usersSheet = ss.getSheetByName("Users");
    const gamesSheet = ss.getSheetByName("Games");
    
    const usersData = usersSheet.getDataRange().getValues();
    const gamesData = gamesSheet.getDataRange().getValues();
    
    if (usersData.length <= 1) return;

    // Criar set para lookup rápido
    const targetSet = {};
    targetEmails.forEach(function(e) { targetSet[e] = true; });
    
    // Inicializar stats apenas para os jogadores alvo
    var userStats = {};
    var rowMap = {}; // email -> row index (1-based)
    for (let i = 1; i < usersData.length; i++) {
        const email = usersData[i][1];
        if (targetSet[email]) {
            userStats[email] = { vitorias: 0, empates: 0, derrotas: 0, pontos: 0, jogos: 0 };
            rowMap[email] = i + 1;
        }
    }
    
    _processGamesIntoStats(gamesData, userStats);
    
    // Atualizar apenas as linhas dos jogadores afetados
    for (var email in rowMap) {
        const row = rowMap[email];
        const s = userStats[email] || { vitorias: 0, empates: 0, derrotas: 0, pontos: 0, jogos: 0 };
        usersSheet.getRange(row, 3, 1, 5).setValues([[s.vitorias, s.empates, s.derrotas, s.pontos, s.jogos]]);
    }
}

// Função partilhada: processa todos os jogos e acumula stats no objecto userStats
function _processGamesIntoStats(gamesData, userStats) {
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
            if (userStats[email] !== undefined) {
                userStats[email].vitorias += winA; 
                userStats[email].empates += draw; 
                userStats[email].derrotas += lossA;
                userStats[email].pontos += ptsA; 
                userStats[email].jogos += 1;
            }
        });
        equipaB.forEach(email => {
            if (userStats[email] !== undefined) {
                userStats[email].vitorias += winB; 
                userStats[email].empates += draw; 
                userStats[email].derrotas += lossB;
                userStats[email].pontos += ptsB; 
                userStats[email].jogos += 1;
            }
        });
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

// Fase 1.3: Batch setValues para editExpense
function editExpense(expenseId, date, description, amount, photoUrl, boxAmount, directContributions) {
  let sheet = getSpreadsheet().getSheetByName("Expenses");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tabela não encontrada." })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  // Headers: "ExpenseID", "Data", "Descricao", "Valor", "FotoUrl", "RegistadoPor", "ValorCaixa", "ContribuicoesDiretas"

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
  const registadoPor = data[rowIndex - 1][5]; // Preservar RegistadoPor original

  // Batch: escrever colunas 2-8 (Data, Descricao, Valor, FotoUrl, RegistadoPor, ValorCaixa, ContribuicoesDiretas) numa única chamada
  sheet.getRange(rowIndex, 2, 1, 7).setValues([[date, description, amount, photoUrl || "", registadoPor, boxAmount, directContributionsStr]]);

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


// ======= LOCATIONS (CAMPOS) =======

function getLocations() {
  const sheet = getSpreadsheet().getSheetByName("Locations");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const loc = {};
    headers.forEach((header, index) => {
      loc[header] = row[index];
    });
    result.push(loc);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function registerLocation(params) {
  let sheet = getSpreadsheet().getSheetByName("Locations");
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet("Locations");
    sheet.appendRow(["LocationID", "Nome", "Morada", "PrecoHora", "PrecoBola", "PrecoColetes", "TipoPiso", "Indoor", "Balnearios", "TipoFutebol", "FotosUrl", "RegistadoPor", "Telefone", "Email", "Notas"]);
  }
  
  const locationId = "loc_" + new Date().getTime();
  
  sheet.appendRow([
    locationId, 
    params.nome, 
    params.morada, 
    params.precoHora, 
    params.precoBola, 
    params.precoColetes, 
    params.tipoPiso, 
    params.indoor ? 1 : 0, 
    params.balnearios ? 1 : 0, 
    params.tipoFutebol, 
    params.fotosUrl || "", 
    params.token,
    params.telefone || "",
    params.email || "",
    params.notas || ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Local registado com sucesso" }))
       .setMimeType(ContentService.MimeType.JSON);
}

// Fase 1.4: Batch setValues para editLocation
function editLocation(params) {
  let sheet = getSpreadsheet().getSheetByName("Locations");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tabela não encontrada." })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.locationId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Local não encontrado." }))
       .setMimeType(ContentService.MimeType.JSON);
  }

  // Headers esperados: LocationID, Nome, Morada, PrecoHora, PrecoBola, PrecoColetes, TipoPiso, Indoor, Balnearios, TipoFutebol, FotosUrl, RegistadoPor, Telefone, Email, Notas
  // Batch: escrever colunas 2-15 numa única chamada (preservar LocationID na col 1 e RegistadoPor na col 12)
  const registadoPor = data[rowIndex - 1][headers.indexOf("RegistadoPor")] || "";
  const rowValues = [
    validateString(params.nome, 200),
    validateString(params.morada, 500),
    validateNumber(params.precoHora, 0, 9999, 0),
    params.precoBola !== undefined ? validateNumber(params.precoBola, 0, 9999, 0) : "",
    params.precoColetes !== undefined ? validateNumber(params.precoColetes, 0, 9999, 0) : "",
    validateString(params.tipoPiso, 100),
    params.indoor ? 1 : 0,
    params.balnearios ? 1 : 0,
    validateString(params.tipoFutebol, 100),
    params.fotosUrl || "",
    registadoPor,
    validateString(params.telefone, 50),
    validateString(params.email, 200),
    validateString(params.notas, 1000)
  ];

  sheet.getRange(rowIndex, 2, 1, rowValues.length).setValues([rowValues]);

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Local atualizado com sucesso" }))
       .setMimeType(ContentService.MimeType.JSON);
}

function deleteLocation(locationId) {
  const sheet = getSpreadsheet().getSheetByName("Locations");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tabela não encontrada" })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === locationId) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Local eliminado." })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Local não encontrado." })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// POLLS (Agendamento Semanal)
// -------------------------------------------------------------

// Fase 1.5: Batch setValues para submitPoll
function submitPoll(userEmail, params) {
  let sheet = getSpreadsheet().getSheetByName("Polls");
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet("Polls");
    sheet.appendRow(["TargetWeek", "UserEmail", "Monday", "Tuesday", "Wednesday", "Thursday", "Locations", "Timestamp"]);
  }

  const { targetWeek, monday, tuesday, wednesday, thursday, locations } = params;
  if (!targetWeek || !userEmail) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Parâmetros em falta" })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Encontrar se já existe voto deste utilizador para esta semana
  for (let i = 1; i < data.length; i++) {
    let weekVal = data[i][0];
    if (weekVal instanceof Date) {
      // Formata a data para a string esperada YYYY-MM-DD
      weekVal = Utilities.formatDate(weekVal, "GMT", "yyyy-MM-dd");
    }
    
    if (weekVal === targetWeek && data[i][1] === userEmail) {
      rowIndex = i + 1;
      break;
    }
  }

  const timestamp = new Date().toISOString();
  const rowValues = [JSON.stringify(monday), JSON.stringify(tuesday), JSON.stringify(wednesday), JSON.stringify(thursday), JSON.stringify(locations), timestamp];

  if (rowIndex === -1) {
    // Inserir novo voto. Adiciona um apóstrofo para forçar a ser texto no Sheets
    sheet.appendRow(["'" + targetWeek, userEmail, ...rowValues]);
  } else {
    // Batch: escrever colunas 3-8 numa única chamada
    sheet.getRange(rowIndex, 3, 1, 6).setValues([rowValues]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Voto registado com sucesso" })).setMimeType(ContentService.MimeType.JSON);
}

function getPolls(targetWeek) {
  const sheet = getSpreadsheet().getSheetByName("Polls");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  const result = [];
  const headers = data[0];
  
  const getIdx = (name) => headers.indexOf(name);

  for (let i = 1; i < data.length; i++) {
    let weekVal = data[i][getIdx("TargetWeek")];
    if (weekVal instanceof Date) {
      weekVal = Utilities.formatDate(weekVal, "GMT", "yyyy-MM-dd");
    }
    // Remover possível apóstrofo se lido como string
    if (typeof weekVal === 'string' && weekVal.startsWith("'")) {
      weekVal = weekVal.substring(1);
    }

    if (!targetWeek || weekVal === targetWeek) {
      let vote = {
        TargetWeek: weekVal,
        UserEmail: data[i][getIdx("UserEmail")],
        Timestamp: data[i][getIdx("Timestamp")]
      };

      try { vote.Monday = JSON.parse(data[i][getIdx("Monday")] || "[]"); } catch(e) { vote.Monday = []; }
      try { vote.Tuesday = JSON.parse(data[i][getIdx("Tuesday")] || "[]"); } catch(e) { vote.Tuesday = []; }
      try { vote.Wednesday = JSON.parse(data[i][getIdx("Wednesday")] || "[]"); } catch(e) { vote.Wednesday = []; }
      try { vote.Thursday = JSON.parse(data[i][getIdx("Thursday")] || "[]"); } catch(e) { vote.Thursday = []; }
      try { vote.Locations = JSON.parse(data[i][getIdx("Locations")] || "[]"); } catch(e) { vote.Locations = []; }

      result.push(vote);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, data: result })).setMimeType(ContentService.MimeType.JSON);
}

// Transformar a conta atual numa conta fantasma (convidado) e desassociar o email Google
function deleteAccount(userEmail) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    
    // Check se utilizador existe
    let userRow = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === userEmail) {
            userRow = i + 1;
            break;
        }
    }
    
    if (userRow === -1) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Utilizador não encontrado." }))
            .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Gerar identificador único de convidado
    const guestEmail = "guest_" + Utilities.getUuid().substring(0, 8) + "@convidado.tikitasco";
    
    // 1. Atualizar utilizador (batch: Col 2 - Email, Col 8 - Avatar, Col 9 - IsGuest)
    sheet.getRange(userRow, 2).setValue(guestEmail);
    sheet.getRange(userRow, 8).setValue("");
    sheet.getRange(userRow, 9).setValue(true);
    
    // 2. Atualizar jogos
    const gamesSheet = ss.getSheetByName("Games");
    const gamesData = gamesSheet.getDataRange().getValues();
    for (let g = 1; g < gamesData.length; g++) {
        let modified = false;
        let eqA = []; let eqB = [];
        try { eqA = JSON.parse(gamesData[g][4]); } catch(e){}
        try { eqB = JSON.parse(gamesData[g][5]); } catch(e){}
        
        if (eqA.includes(userEmail)) {
            eqA = eqA.map(e => e === userEmail ? guestEmail : e);
            modified = true;
        }
        if (eqB.includes(userEmail)) {
            eqB = eqB.map(e => e === userEmail ? guestEmail : e);
            modified = true;
        }
        
        if (modified) {
            gamesSheet.getRange(g + 1, 5, 1, 2).setValues([[JSON.stringify(eqA), JSON.stringify(eqB)]]);
        }
    }
    
    // 3. Atualizar votações
    const votesSheet = ss.getSheetByName("Votes");
    const votesData = votesSheet.getDataRange().getValues();
    for (let v = 1; v < votesData.length; v++) {
        const isVoter = votesData[v][0] === userEmail;
        const isTarget = votesData[v][1] === userEmail;
        if (isVoter || isTarget) {
            const newVoter = isVoter ? guestEmail : votesData[v][0];
            const newTarget = isTarget ? guestEmail : votesData[v][1];
            votesSheet.getRange(v + 1, 1, 1, 2).setValues([[newVoter, newTarget]]);
        }
    }
    
    recalculateAllUserStats();
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Conta eliminada e transformada em convidado." }))
        .setMimeType(ContentService.MimeType.JSON);
}

// Editar o nome de um utilizador convidado (Guest)
function editGuestName(guestEmail, newName) {
    if (!guestEmail || typeof newName !== "string" || newName.trim().length === 0) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Dados inválidos." }))
            .setMimeType(ContentService.MimeType.JSON);
    }
    
    const validName = validateString(newName.trim(), 100);
    const sheet = getSpreadsheet().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === guestEmail) {
            // Verificar se é Guest (Coluna I - index 8)
            if (data[i][8] !== true) {
                return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Apenas convidados podem ser editados desta forma." }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
            
            // Atualizar o nome (Coluna A - index 0)
            sheet.getRange(i + 1, 1).setValue(validName);
            
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Nome atualizado com sucesso!" }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Convidado não encontrado." }))
        .setMimeType(ContentService.MimeType.JSON);
}
