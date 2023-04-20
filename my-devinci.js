//const data = require('./data.json')
//const FileCookieStore = require('tough-cookie-filestore2')
const axios = require('axios');
const FormData = require('form-data');
const ExceptionController = require('./exceptionController.js');
const nodemailer = require('nodemailer');
const fs = require('fs');

let emailcheck = false;

getConnexionToken = async () => {
  try {
    const response = await axios({
      url: endpoint + '/o/token',
      method: 'post',
      headers: {
        Accept: '*/*',
        'Content-Type': 'multipart/form-data',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
      data: {
        grant_type: 'password',
        client_id: 'public',
        username: username,
        password: password,
      },
    });
    const { data } = response;
    const token = data.token_type + ' ' + data.access_token;
    return token;
  } catch (error) {
    return error;
  }
};

readConnexionToken = async () => {
  try {
    const token = await fs.readFileSync('token.txt', 'utf8');
    return token.replace(/\\n/g, '');
  } catch (error) {
    return error;
  }
};

//Ajouter la recuperation du token de refreshing
getOpenCallInfo = async (authToken) => {
  try {
    const response = await axios({
      url: 'https://api.devinci.me/students/presences',
      method: 'get',
      headers: {
        'accept-encoding': 'gzip',
        Authorization: authToken,
        Host: 'api.devinci.me',
      },
    });
    const { data } = response;
    for (let i = 0; i < data.length; i++) {
      if (
        data[i].etat_ouverture == 'ouverte' &&
        data[i].etat_presence != 'présent'
      ) {
        return {
          seance_id: data[i].seance_id,
          nom: data[i].nom,
          horaire: data[i].horaire,
        };
      }
    }
    return { seance_id: null, nom: null, horaire: null };
  } catch (error) {
    return 'token-error : '+error;
  }
};

makeCall = async (authToken, seance_id) => {
  try {
    const response = await axios({
      url: 'https://api.devinci.me/students/presence/' + seance_id,
      method: 'post',
      headers: {
        'accept-encoding': 'gzip',
        authorization: authToken,
        Host: 'api.devinci.me',
        'content-length': 0,
      },
    });
    const { data } = response;
    return [data];
  } catch (error) {
    return error;
  }
};

function main() {
  (async () => {
    /*const newElement = {
      nom: 'New Event',
      date: '2022-03-15',
      horaire: '13:00:00 - 14:30:00',
    };*/

    //ExceptionController.addToFile(newElement);
    //ExceptionController.removePassedEvents();

    let token = await readConnexionToken(); //await getConnexionToken()
    let transporter = nodemailer.createTransport({
      service: 'iCloud',
      auth: {
        user: 'iixgriimzz', // generated ethereal user
        pass: 'xlld-janf-elnv-egwl', // generated ethereal password
      },
    });

    dn = new Date();
    timecode =
      dn.getHours() + ':' + dn.getMinutes() + ':' + dn.getSeconds() + '  ';

    let openCallInfo = await getOpenCallInfo(token);
    if (openCallInfo.includes("token-error")) {
      //probleme de token
      if (!emailcheck) {
        let info = await transporter.sendMail({
          from: '"MyApi" <myapi@icloud.com>', // sender address
          to: 'gabriel.chaiix@gmail.com', // list of receivers
          subject: 'Token - MyDevinci', // Subject line
          text: '', // plain text body
          html: '<b>Need a new token\nProxyman -> Hypernuc</b>' + openCallInfo, // html body
        });
      }
      console.log(timecode + '\t:\t' + openCallInfo);
      emailcheck = true;
    } else if (
      //remplissage de l'appel ouvert
      !ExceptionController.checkIfExists(openCallInfo) &&
      openCallInfo.seance_id
    ) {
      console.log(openCallInfo);
      let res = await makeCall(token, openCallInfo.seance_id);
      console.log(timecode + '\t:\t' + res);
      let info = await transporter.sendMail({
        from: '"MyApi" <myapi@icloud.com>', // sender address
        to: 'gabriel.chaiix@gmail.com', // list of receivers
        subject:
          'Appel - ' +
          openCallInfo.nom +
          ' | ' +
          openCallInfo.horaire.split('-')[0], // Subject line
        text: '', // plain text body
        html: timecode + '\t:\t' + JSON.stringify(res), // html body
      });
      openCallInfo = null;
      emailcheck = false;
    } else {
      //pas d'appel ouvert
      console.log(timecode + '\t:\t' + "Pas d'appel ouvert");
      emailcheck = false;
    }
  })();
  setTimeout(() => {
    main();
  }, 20000); //time*60000
}
main();
