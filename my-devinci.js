require('dotenv').config();
console.log(process.env);
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const DevinciAuth = require('./devinciauth.js');
const ExceptionController = require('./exceptionController.js');
const nodemailer = require('nodemailer');

const devinci_email = process.env.DEVINCI_EMAIL;
const devinci_password = process.env.DEVINCI_PASSWORD;
const icloud_user = process.env.ICLOUD_USER;
const icloud_password = process.env.ICLOUD_PASSWORD;

let emailcheck = 0;
token = '';

getConnexionToken = async () => {
  try {
    const devinciAuth = new DevinciAuth(devinci_email, devinci_password);
    await devinciAuth.init();
    let token = await devinciAuth.getToken();
    return token;
  } catch (error) {
    return error;
  }
};

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
    return 'token-error : ' + error;
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

    //let token = await readConnexionToken(); //await getConnexionToken()

    let transporter = nodemailer.createTransport({
      service: 'iCloud',
      auth: {
        user: icloud_user, // generated ethereal user
        pass: icloud_password, // generated ethereal password
      },
    });

    dn = new Date();
    timecode =
      dn.getHours() + ':' + dn.getMinutes() + ':' + dn.getSeconds() + '  ';

    let openCallInfo = await getOpenCallInfo(token);
    if (
      typeof openCallInfo === 'string' &&
      openCallInfo.includes('token-error')
    ) {
      //probleme de token
      if (!emailcheck) {
        let info = await transporter.sendMail({
          from: '"MyApi" <myapi@icloud.com>', // sender address
          to: 'gabriel.chaiix@gmail.com', // list of receivers
          subject: 'Token Error - MyDevinci', // Subject line
          text: '', // plain text body
          html:
            '<b>Token error : Proxyman -> Hypernuc</b>' +
            openCallInfo +
            '\n' +
            token, // html body
        });
      }
      console.log(timecode + '\t:\t' + openCallInfo);
      emailcheck += 1;
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
        subject: 'Appel - MyDevinci', // Subject line
        text: '', // plain text body
        html: timecode + '\t:\t' + res, // html body
      });
      openCallInfo = null;
      emailcheck = 0;
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
