const http = require('http');
const jwt = require('./node_modules/jsonwebtoken');

const token = jwt.sign({ id: 5, role: 'user' }, 'supersecretkey');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/user/orders',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
