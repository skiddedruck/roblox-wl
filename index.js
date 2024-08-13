const fs = require('fs/promises');
require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Load whitelist.json
let whitelistData = require('./whitelist.json');

// Helper function to save whitelist data
const saveWhitelist = async () => {
  try {
    await fs.writeFile('whitelist.json', JSON.stringify(whitelistData, null, 2));
  } catch (err) {
    console.error('Error saving whitelist:', err);
  }
};

// Endpoint to check if a user is whitelisted
app.get('/whitelist/:discordUserId', (req, res) => {
  const user = whitelistData.WhitelistedUsers[req.params.discordUserId];
  if (user) {
    res.json({ whitelisted: true, user });
  } else {
    res.json({ whitelisted: false });
  }
});

// Endpoint to add a user to the whitelist
app.post('/whitelist/:discordUserId', async (req, res) => {
  if (!req.headers.authorization) {
    res.sendStatus(400);
    return;
  }
  if (req.headers.authorization === `WlKey ${process.env.WL_KEY}`) {
    const { hash, attackable, level, tags } = req.body;
    
    if (!hash || typeof attackable !== 'boolean' || typeof level !== 'number' || !Array.isArray(tags)) {
      res.sendStatus(400); // Bad request
      return;
    }
    
    whitelistData.WhitelistedUsers[req.params.discordUserId] = {
      hash,
      attackable,
      level,
      tags
    };
    
    await saveWhitelist();
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

// Endpoint to remove a user from the whitelist
app.post('/unwhitelist/:discordUserId', async (req, res) => {
  if (!req.headers.authorization) {
    res.sendStatus(400);
    return;
  }
  if (req.headers.authorization === `WlKey ${process.env.WL_KEY}`) {
    if (whitelistData.WhitelistedUsers[req.params.discordUserId]) {
      delete whitelistData.WhitelistedUsers[req.params.discordUserId];
      await saveWhitelist();
      res.sendStatus(200);
    } else {
      res.sendStatus(404); // Not found
    }
  } else {
    res.sendStatus(401);
  }
});

// Endpoint to fetch all tags
app.get('/tags', (req, res) => {
  res.json(whitelistData.WhitelistedTags);
});

app.listen(port, () => {
  console.log(`WL listening on port ${port}`);
});
