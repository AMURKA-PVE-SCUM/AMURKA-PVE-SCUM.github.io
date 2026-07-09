import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { Octokit } from '@octokit/rest';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  rest: { api: 'https://lolka.app/api/bot' },
});

const CHANNEL_SCREENSHOTS = process.env.CHANNEL_SCREENSHOTS || '';
const CHANNEL_NEWS = process.env.CHANNEL_NEWS || '';
const CHANNEL_GUIDES = process.env.CHANNEL_GUIDES || '';
const CHANNEL_WELCOME = process.env.CHANNEL_WELCOME || '';
const CHANNEL_VOTES = process.env.CHANNEL_VOTES || '';
const GUILD_ID = process.env.GUILD_ID || '';
const ROLE_PLAYERS = process.env.ROLE_PLAYERS || '';

const CATEGORY_MAP = {
  'охота': 'охота',
  'база': 'база',
  'крафт': 'крафт',
  'pve': 'pve',
  'экономика': 'экономика',
  'новичкам': 'новичкам',
};

const CATEGORY_ICONS = {
  'охота': 'fa-crosshairs',
  'база': 'fa-home',
  'крафт': 'fa-tools',
  'pve': 'fa-skull',
  'экономика': 'fa-coins',
  'новичкам': 'fa-heart',
  'гайд': 'fa-book',
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');

client.on('messageCreate', async (message) => {
  if (message.author?.bot) return;

  const channel = message.channel;

  if (CHANNEL_SCREENSHOTS && channel.id === CHANNEL_SCREENSHOTS) {
    const attachments = message.attachments.filter((a) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(a.name)
    );
    if (attachments.size > 0) {
      await updateScreenshots(message, attachments);
    }
  }

  if (CHANNEL_NEWS && channel.id === CHANNEL_NEWS) {
    await updateNews(message);
  }

  if (CHANNEL_GUIDES && channel.id === CHANNEL_GUIDES) {
    await updateGuides(message);
  }

  if (!message.content) return;
  const cmd = message.content.trim();
  try {
    if (cmd === '!status') await sendServerStatus(channel);
    else if (cmd === '!help') await sendHelp(channel);
    else if (cmd === '!online') await sendOnlinePlayers(channel);
    else if (cmd === '!ping') await sendPing(channel);
    else if (cmd === '!server') await sendServerInfo(channel);
  } catch (e) {
    console.error('❌ Command error:', e.message);
    channel.send('❌ Ошибка выполнения команды').catch(() => {});
  }
});

client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== GUILD_ID) return;

  if (ROLE_PLAYERS) {
    try {
      const role = member.guild.roles.cache.get(ROLE_PLAYERS);
      if (role) await member.roles.add(role);
    } catch (e) {
      console.error('Role assign error:', e.message);
    }
  }

  const channel = member.guild.channels.cache.get(CHANNEL_WELCOME);
  if (!channel) return;

  try {
    await channel.send(
      `🏝️ **Добро пожаловать на AMURKA PVE!**\n\n` +
      `Привет, ${member}! Добро пожаловать на сервер.\n\n` +
      `📜 Ознакомься с правилами в канале #правила\n` +
      `📥 [Скачать лаунчер](https://github.com/AMURKA-PVE-SCUM/AMURKA-PVE-Launcher/releases/download/v2.0.0/AMURKA.PVE.Launcher.Setup.2.0.0.exe)\n` +
      `🗳 [Проголосовать за сервер](https://wargm.ru/server/77385/votes)\n` +
      `🌐 [Наш сайт](https://amurka-pve-scum.github.io/)\n` +
      `🎮 IP сервера: **85.88.179.207:7004**\n\n` +
      `Используй \`!help\` для списка команд`
    );
  } catch (e) {
    console.error('❌ Welcome error:', e.message);
  }
});

async function updateScreenshots(message, attachments) {
  try {
    const { data: file } = await octokit.repos.getContent({
      owner, repo, path: 'data/screenshots.json',
    }).catch(() => ({ data: null }));

    let screenshots = [];
    if (file?.content) {
      screenshots = JSON.parse(Buffer.from(file.content, 'base64').toString());
    }

    for (const [, att] of attachments) {
      const ext = att.name.includes('.') ? att.name.split('.').pop() : 'webp';
      const ts = Date.now();
      const imgPath = `data/screenshots/${ts}.${ext}`;

      const imgRes = await fetch(att.url);
      const imgBuf = Buffer.from(await imgRes.arrayBuffer());
      const b64 = imgBuf.toString('base64');

      try {
        await octokit.repos.createOrUpdateFileContents({
          owner, repo, path: imgPath,
          message: `Screenshot from ${message.author.username}`,
          content: b64,
          sha: undefined,
        });

        const rawUrl = `https://${repo}/${imgPath}`;

        screenshots.unshift({
          url: rawUrl,
          author: message.author.username,
          date: new Date().toISOString(),
          message: message.content || '',
        });
      } catch (uploadErr) {
        console.error('❌ Upload error:', uploadErr.message);
      }
    }

    screenshots = screenshots.slice(0, 50);

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: 'data/screenshots.json',
      message: `Update screenshots from ${message.author.username}`,
      content: Buffer.from(JSON.stringify(screenshots, null, 2)).toString('base64'),
      sha: file?.sha,
    });

    console.log(`✅ Screenshots updated: ${attachments.size} file(s)`);
  } catch (e) {
    console.error('❌ Screenshot update error:', e.message);
  }
}

async function updateNews(message) {
  try {
    const { data: file } = await octokit.repos.getContent({
      owner, repo, path: 'data/news.json',
    }).catch(() => ({ data: null }));

    let news = [];
    if (file?.content) {
      news = JSON.parse(Buffer.from(file.content, 'base64').toString());
    }

    news.unshift({
      title: message.content.split('\n')[0] || 'Новость',
      content: message.content,
      author: message.author.username,
      date: new Date().toISOString(),
      attachments: message.attachments.map((a) => a.url),
    });

    news = news.slice(0, 20);

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: 'data/news.json',
      message: `Update news from ${message.author.username}`,
      content: Buffer.from(JSON.stringify(news, null, 2)).toString('base64'),
      sha: file?.sha,
    });

    console.log(`✅ News updated: ${message.author.username}`);
  } catch (e) {
    console.error('❌ News update error:', e.message);
  }
}

function slugify(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': 'y', 'ы': 'y', 'ь': 'e', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  };
  return text.toLowerCase()
    .replace(/[а-яё]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40) || 'guide';
}

async function updateGuides(message) {
  try {
    const hashtagRe = /#[^\s#]+/g;
    const allTags = message.content.match(hashtagRe) || [];
    const hashtags = allTags.map(t => t.slice(1).toLowerCase());

    const raw = message.content.replace(hashtagRe, '').trim();
    const lines = raw.split('\n').filter(l => l.trim());
    const title = lines[0]?.trim() || 'Гайд';
    const cleanBody = lines.slice(1).join('\n') || title;

    const rawCategory = hashtags.find(t => CATEGORY_MAP[t]) || 'гайд';
    const category = CATEGORY_MAP[rawCategory] || rawCategory;
    const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS['гайд'];

    const paragraphs = cleanBody.split('\n').filter(l => l.trim());
    const contentHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');

    const id = slugify(title) + '-' + Date.now().toString(36);

    const description = paragraphs[0]?.substring(0, 120) || title;

    const { data: file } = await octokit.repos.getContent({
      owner, repo, path: 'data/guides.json',
    }).catch(() => ({ data: null }));

    let guides = [];
    if (file?.content) {
      guides = JSON.parse(Buffer.from(file.content, 'base64').toString());
    }

    const guideImages = [];
    for (const [, att] of message.attachments) {
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(att.name)) continue;
      const ext = att.name.includes('.') ? att.name.split('.').pop() : 'webp';
      const ts = Date.now();
      const imgPath = `data/guides/${ts}.${ext}`;

      try {
        const imgRes = await fetch(att.url);
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const b64 = imgBuf.toString('base64');

        await octokit.repos.createOrUpdateFileContents({
          owner, repo, path: imgPath,
          message: `Guide image: ${title}`,
          content: b64,
        });

        guideImages.push(`https://${repo}/${imgPath}`);
      } catch (uploadErr) {
        console.error('❌ Guide image upload error:', uploadErr.message);
      }
    }

    guides.unshift({
      id,
      title,
      description,
      category,
      icon,
      images: guideImages,
      content: contentHTML,
    });

    guides = guides.slice(0, 30);

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: 'data/guides.json',
      message: `Add guide: ${title}`,
      content: Buffer.from(JSON.stringify(guides, null, 2)).toString('base64'),
      sha: file?.sha,
    });

    console.log(`✅ Guide added: ${title} (${category})`);
  } catch (e) {
    console.error('❌ Guide update error:', e.message);
  }
}

async function sendServerStatus(channel) {
  const res = await fetch('https://api.battlemetrics.com/servers/38990087');
  const data = await res.json();
  const a = data.data.attributes;

  const status = a.status === 'online' ? '🟢 Онлайн' : '🔴 Офлайн';
  await channel.send(
    `**🎮 AMURKA PVE MOD — Статус**\n\n` +
    `Статус: ${status}\n` +
    `Игроки: ${a.players} / ${a.maxPlayers}\n` +
    `Версия: ${a.details.version.substring(0, 11)}\n` +
    `IP: 85.88.179.207:7004\n\n` +
    `_Данные: BattleMetrics_`
  );
}

async function sendHelp(channel) {
  await channel.send(
    `**📋 Команды бота**\n\n` +
    `\`!status\` — Статус сервера (онлайн/оффлайн, игроки)\n` +
    `\`!online\` — Список игроков на сервере\n` +
    `\`!server\` — Подробная информация о сервере\n` +
    `\`!ping\` — Пинг бота\n` +
    `\`!help\` — Это сообщение`
  );
}

async function sendOnlinePlayers(channel) {
  const res = await fetch('https://api.battlemetrics.com/servers/38990087?include=players');
  const data = await res.json();
  const players = data.included?.filter((p) => p.type === 'player') || [];

  if (players.length === 0) {
    return channel.send('Сейчас никто не онлайн');
  }

  const list = players.map((p, i) => `${i + 1}. ${p.attributes.name}`).join('\n');
  await channel.send(`**🟢 Онлайн: ${players.length}**\n\n${list.substring(0, 1900)}\n\n_Данные: BattleMetrics_`);
}

async function sendPing(channel) {
  await channel.send(`🏓 Понг! Задержка WS: **${client.ws.ping}ms**`);
}

async function sendServerInfo(channel) {
  const res = await fetch('https://api.battlemetrics.com/servers/38990087');
  const data = await res.json();
  const a = data.data.attributes;
  const d = a.details;

  await channel.send(
    `**ℹ️ AMURKA PVE MOD — Инфо**\n\n` +
    `Название: ${a.name}\n` +
    `Карта: ${d.map || 'Неизвестно'}\n` +
    `Режим: ${d.gameMode || 'PVE'}\n` +
    `Игроки: ${a.players} / ${a.maxPlayers}\n` +
    `Версия: ${d.version || 'Неизвестно'}\n` +
    `Регион: ${d.region || 'Неизвестно'}\n` +
    `IP: 85.88.179.207:7004\n` +
     `Сайт: https://amurka-pve-scum.github.io/\n\n` +
    `_Данные: BattleMetrics_`
  );
}

client.once('ready', (c) => {
  console.log(`✅ Бот запущен: ${c.user.tag}`);

  if (CHANNEL_VOTES) {
    const sendVoteReminder = () => {
      const ch = client.channels.cache.get(CHANNEL_VOTES);
      if (!ch) return;
      ch.send(
        `🗳 Голосуй за сервер — это помогает привлечь новых игроков!\n` +
        `За голоса можно покупать предметы на сервере.\n` +
        `<https://wargm.ru/server/77385/votes>`
      ).catch(() => {});
    };
    sendVoteReminder();
    setInterval(sendVoteReminder, 4 * 60 * 60 * 1000); // каждые 4 часа
  }
});

process.on('uncaughtException', (e) => console.error('💥', e.message));
process.on('unhandledRejection', (e) => console.error('💥', e.message));

client.login(process.env.LOLKA_TOKEN);
