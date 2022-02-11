const express = require('express')
const { exec } = require("child_process");
const app = express()
const port = 3000

const prefix = 'wl_'
const isWin = process.platform === 'win32'
const ipRegex = '((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}'

async function Unwl(ip, cb) {
  if (ip == undefined || !ip.match(ipRegex)) {
    cb('err')
    console.log(`Invalid ip : ` + ip);
    return;
  }

  var command = "netsh advfirewall firewall delete rule name=" + prefix + ip + ""

  if(!isWin)
    command = "iptables -D INPUT -s " + ip + " -j ACCEPT"

  exec(command, (error, stdout, stderr) => {
    if (error) {
      if(error.message.includes('does a matching rule exist in that chain')) {
        cb('ok')
        return;
      }

      if(stdout.includes('gle ne correspond aux crit') || stdout.includes('No rules match the specified criteria')) {
        cb('ok')
        return;
      }

      cb('err')
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      cb('err')
      console.log(`stderr: ${stderr}`);
      return;
    }

    if (isWin ? stdout.includes('Ok.') : stdout == '') {
      console.log(`Unwhitelisted ip : ` + ip);
      cb('ok')
    } else {
      console.log(`stdout: ${stdout}`);
      cb('err')
    }
  });
}

app.get('/unwlall', (req, res) => {
  var command = "netsh advfirewall firewall show rule name=all"

  if(!isWin)
    command = "iptables -S INPUT"

  exec(command, (error, stdout, stderr) => {
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

      if (isWin) {
        stdout.split('\n').forEach(line => {
          if (line.includes(prefix) && line.includes(':')) {
            const splitted = line.split(':')[1].trim()
            Unwl(splitted.replace(prefix, ''), () => {})
          }
        });
        res.send('ok')
      } else {
        stdout.split('\n').forEach(line => {
          if (line.match('-A INPUT -s ([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\/32 -j ACCEPT')) {
            Unwl(line.replace('-A INPUT -s ', '').replace('/32 -j ACCEPT', ''), () => {})
          }
        });
        res.send('ok')
      }
  });
})

app.get('/unwl', async (req, res) => {
  await Unwl(req.query.ip, (r) => {
    res.send(r)
  })
})

app.get('/wl', (req, res) => {
  const ip = req.query.ip

  if (ip == undefined || !ip.match(ipRegex)) {
    res.send('err')
    console.log(`Invalid ip : ` + ip);
    return;
  }

  var command = "netsh advfirewall firewall add rule name=" + prefix + ip + " dir=in action=allow remoteip=" + ip

  if(!isWin)
    command = "iptables -A INPUT -s " + ip + " -j ACCEPT"

  exec(command, (error, stdout, stderr) => {
      if (error) {
        res.send('err')
        console.log(`error: ${error}`);
        return;
      }
      if (stderr) {
        res.send('err')
        console.log(`stderr: ${stderr}`);
        return;
      }

      if (isWin ? stdout.includes('Ok.') : stdout == '') {
        console.log(`Whitelisted ip : ` + ip);
        res.send('ok')
      } else {
        console.log(`stdout: "${stdout}"`);
        res.send('err')
      }
  });
})

app.listen(port, () => {
  console.log(`API version ${isWin ? 'Windows' : 'Linux'} lancé sur le port : ${port}`)
})
