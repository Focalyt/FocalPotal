const { google } = require('googleapis')
const {sheetId} = require('../../../config')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const serviceAccountKeyFile = "./focalyt-new-key.json";
const tabName = 'candidates'


module.exports = {
  updateSpreadSheetValues
}

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: SCOPES
  });
  const authToken = await auth.getClient();

  const sheets = google.sheets({
    version: 'v4',
    auth: authToken,
  });
  return sheets;
}

async function updateSpreadSheetValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${tabName}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}