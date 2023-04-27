const axios = require('axios');
const querystring = require('querystring');

const authorizationUrl = 'https://adfs.devinci.fr/adfs/oauth2/authorize';
const tokenUrl = 'https://adfs.devinci.fr/adfs/oauth2/token';
const clientId = 'ada8d8-98f42d-0df633-c1f59b-a64d83';
const redirectUri = 'com.devinci.mobile:/oauthredirect';
const authEndpoint = `${authorizationUrl}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
  redirectUri
)}`;

let headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
};

function getSetCookies(headers) {
  const setCookies = headers['set-cookie'];
  if (setCookies) {
    return setCookies.map((cookie) => cookie.split(';')[0]).join('; ');
  }
  return '';
}

class DevinciAuth {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.init();
    this.getToken();
    this.access_token = null;
    this.refresh_token = null;
  }

  async getToken() {
    return 'Bearer ' + this.access_token;
  }

  async init() {
    this.tokens = await this.getAuthData();
  }

  getAuthData = async () => {
    const authData = querystring.stringify({
      UserName: this.email,
      Password: this.password,
      AuthMethod: 'FormsAuthentication',
    });

    try {
      let n = 0;
      const client = axios.create({
        withCredentials: true,
      });
      const response = await client.post(authEndpoint, authData, {
        headers,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 303; // default
        },
      });
      const cookies = getSetCookies(response.headers);
      headers = {
        ...headers,
        Cookie: cookies,
      };

      while (!response.headers.location.startsWith(redirectUri) && n < 3) {
        n++;
        const response = await client.post(authEndpoint, authData, {
          headers,
          withCredentials: true,
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 303; // default
          },
        });
        const location = response.headers.location;
        const code = location.split('code=')[1].split('&')[0];

        const tokenData = querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: 'ada8d8-98f42d-0df633-c1f59b-a64d83',
          redirect_uri: 'com.devinci.mobile:/oauthredirect',
        });
        const token = await client.post(tokenUrl, tokenData, {
          headers,
          withCredentials: true,
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 303; // default
          },
        });
        this.access_token = token['data']['access_token'];
        this.refresh_token = token['data']['refresh_token'];
        return token['data'];
      }
      return null;
    } catch (error) {
      console.error(error);
    }
  };

  request = async (url, method, data) => {
    const res = await axios('https://api.devinci.me/' + url, {
      method: method,
      data: data,
      headers: {
        Authorization: 'Bearer ' + this.access_token,
      },
    });
    return res.data;
  };
}

module.exports = DevinciAuth;

/*
//tonfichier.js
const DevinciAuth = require('./devinciauth.js');

async function main() {
  //on initialise ainsi la classe
  const devinciAuth = new DevinciAuth(
    'elias.tourneux@edu.devinci.fr',
    '**************'
  );
  await devinciAuth.init();

  //on peut ensuite faire des requêtes
  const profile = await devinciAuth.request('students/profile', 'GET', null);
  console.log(profile);
}

main();
*/
