const fs = require('fs/promises');
require('dotenv').config();

const express = require('express');
const app = express();

const port = 3000;

let { whitelistedUsers } = require('./whitelist.json');

app.get('/whitelist/:userId', (req, res) => {
  res.json({ whitelisted: whitelistedUsers.includes(req.params.userId) });
});

app.post('/whitelist/:userId', async (req, res) => {
  if (!req.headers.authorization) {
    res.sendStatus(400);
    return;
  }
  if (req.headers.authorization === `WlKey ${process.env.WL_KEY}`) {
    whitelistedUsers.push(req.params.userId);
    await saveUsers();
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.post('/unwhitelist/:userId', async (req, res) => {
  if (!req.headers.authorization) {
    res.sendStatus(400);
    return;
  }
  if (req.headers.authorization === `WlKey ${process.env.WL_KEY}`) {
    whitelistedUsers = whitelistedUsers.filter(
      (userId) => userId !== req.params.userId
    );
    await saveUsers();
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

const saveUsers = async () => {
  try {
    await fs.writeFile(
      'whitelist.json',
      JSON.stringify({ whitelistedUsers: whitelistedUsers }, null, 2)
    );
  } catch (err) {
    console.error('Error saving users:', err);
  }
};

process.on('SIGTERM', saveUsers);
process.on('SIGINT', saveUsers);

app.listen(port, () => {
  console.log('WL listening');
});
