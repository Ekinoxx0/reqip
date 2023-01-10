const express = require('express')
const { exec } = require("child_process");
const app = express()
const port = 3000

const prefix = 'wl_'
const isWin = process.platform === 'win32'
const ipRegex = '([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})'

async function Unwl(ip, cb) {
  if (ip == undefined || !ip.match(ipRegex)) {
    cb('err')
    console.log(`Invalid ip : ` + ip);
    return;
  }

  var command = "netsh advfirewall firewall delete rule name=" + prefix + ip + ""

  if(!isWin)
    command = "iptables -D INPUT_WL -s " + ip + " -j ACCEPT"

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

    if (isWin ? stdout.toLowerCase().includes('ok.') : stdout == '') {
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

  if(!isWin) {
    exec('iptables -F INPUT_WL', (error, stdout, stderr) => {
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

        res.send('ok')
    });
    return
  }

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

      stdout.split('\n').forEach(line => {
        if (line.includes(prefix) && line.includes(':')) {
          const splitted = line.split(':')[1].trim()
          Unwl(splitted.replace(prefix, ''), () => {})
        }
      });
      res.send('ok')
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
    command = "iptables -A INPUT_WL -s " + ip + " -j ACCEPT"

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

      if (isWin ? stdout.toLowerCase().includes('ok.') : stdout == '') {
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
