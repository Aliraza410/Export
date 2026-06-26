import http from 'http';

http.get('http://localhost:5000/api/dashboard/stats', (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).on('error', (e) => {
  console.error(e);
});
