'use strict';

const path = require('path');
const fs = require('fs');
const Discord = require('discord.js');

exports.enforcer = (req, res) => {
  if(req.query.API_KEY !== process.env['API_KEY']) {
    res.status(401).send('Fuck off');
    return;
  }

  // Create an instance of a Discord client
  const client = new Discord.Client();

  client.on('ready', () => {
    console.log('I am ready!');

    client.guilds.fetch(process.env['GUILD_ID'])
      .then((guild) => {
        console.log(`Got guild ${guild.name}`);
        return guild.members.fetch({withPresences: true});
      })
      .then((members) => {
        console.log(`Got ${members.size} members`);
        const inEnforcedChannel = members.filter(member => member.voice?.channel?.id === process.env['ENFORCED_CHANNEL_ID']);
        console.log(`There are currently ${inEnforcedChannel.size} members in the channel!`);
        if(inEnforcedChannel.size < 1) {
          return Promise.reject({status: 404});
        }
        return Promise.all(inEnforcedChannel.map(member => {
          return member.voice.setMute(true).then(() =>  member);
        }));
      })
      .then((members) => {
        const tempMember = members[0];
        return Promise.all([members, tempMember.voice.channel.join()]);
      })
      .then(([members, connection]) => {
        try {
          const noise = fs.createReadStream(path.join(__dirname, 'noises', process.env['NOISE_TO_PLAY'] || 'leave.mp3'));
          return new Promise((resolve, reject) => {
            connection.play(noise)
              .on('finish', () => {
                connection.disconnect();
                resolve(members);
              })
              .on('error', (err) => reject(err));
          });
        } catch (err) {
          return Promise.reject(err)
        }
      })
      .then(members => {
        return Promise.all(members.map(member => {
          return member.voice.setMute(false).then(() => member);
        }));
      })
      .then(() => {
        res.status(200).send();
      })
      .catch(err => {
        console.error(`Failed! ${err}`, err);
        res.status(err?.status || 500).send();
      });
  });


  // Log our bot in using the token from https://discord.com/developers/applications
  client.login(process.env['DISCORD_BOT_TOKEN']);
};
