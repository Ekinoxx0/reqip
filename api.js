const express = require('express')
const { exec } = require("child_process");
const app = express()
const port = 3000

const ipRegex = '((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}'

app.get('/unwl', (req, res) => {
  const ip = req.query.ip

  if (ip == undefined || !ip.match(ipRegex)) {
    res.send('err')
    console.log(`Invalid ip : ` + ip);
    return;
  }

  exec("iptables -D INPUT -s " + ip + " -j ACCEPT", (error, stdout, stderr) => {
      if (error) {
        if(error.message.includes('does a matching rule exist in that chain')) {
          res.send('ok')
          return;
        }

        res.send('err')
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        res.send('err')
        console.log(`stderr: ${stderr}`);
        return;
      }

      if (stdout == '') {
        console.log(`Unwhitelisted ip : ` + ip);
        res.send('ok')
      } else {
        console.log(`stdout: ${stdout}`);
        res.send('err')
      }
  });
})

app.get('/wl', (req, res) => {
  const ip = req.query.ip

  if (ip == undefined || !ip.match(ipRegex)) {
    res.send('err')
    console.log(`Invalid ip : ` + ip);
    return;
  }

  exec("iptables -A INPUT -s " + ip + " -j ACCEPT", (error, stdout, stderr) => {
      if (error) {
        res.send('err')
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        res.send('err')
        console.log(`stderr: ${stderr}`);
        return;
      }

      if (stdout == '') {
        console.log(`Whitelisted ip : ` + ip);
        res.send('ok')
      } else {
        console.log(`stdout: ${stdout}`);
        res.send('err')
      }
  });
})

app.listen(port, () => {
  console.log(`API lancé sur le port : ${port}`)
})