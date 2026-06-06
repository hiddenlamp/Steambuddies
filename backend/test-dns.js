const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.cluster0.00lxdht.mongodb.net', (err, addresses) => {
  if (err) console.error("SRV Error:", err.message);
  else console.log("SRV Addresses:", addresses);
});
