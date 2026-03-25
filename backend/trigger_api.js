const http = require('http');

const loginData = JSON.stringify({
  email: 'lisa@jmart.com',
  password: 'password123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    const token = response.token;
    console.log("Logged in, token received.");

    const jastipOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/user/jastips',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const jastipReq = http.request(jastipOptions, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        console.log("Jastip API called. Check server logs.");
        process.exit(0);
      });
    });
    jastipReq.end();
  });
});

loginReq.write(loginData);
loginReq.end();
