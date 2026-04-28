const PODCASTS = [
  {
    name: "Hebrew Time",
    rss: "https://corsproxy.io/?https://anchor.fm/s/3f7a77ec/podcast/rss"
  },
  {
    name: "Streetwise Hebrew",
    rss: "https://corsproxy.io/?https://streetwisehebrew.libsyn.com/swh.rss"
  },
  {
    name: "Hebrew Time",
    rss: "https://corsproxy.io/?https://anchor.fm/s/3f7a77ec/podcast/rss"
  },
  {
    name: "Streetwise Hebrew",
    rss: "https://corsproxy.io/?https://streetwisehebrew.libsyn.com/swh.rss"
  }
];

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const episodeTitle = document.getElementById('episode-title');
const episodeSource = document.getElementById('episode-source');
const todayMinutes = document.getElementById('today-minutes');
const totalMinutes = document.getElementById('total-minutes');

let isPlaying = false;
let secondsToday = 0;
let secondsTotal = 0;
let timer = null;

// Загружаем статистику из localStorage
function loadStats() {
  const today = new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem('hebrewStats') || '{}');
  if (saved.date === today) {
    secondsToday = saved.today || 0;
  }
  secondsTotal = parseInt(localStorage.getItem('hebrewTotal') || '0');
  updateStats();
}

function saveStats() {
  const today = new Date().toDateString();
  localStorage.setItem('hebrewStats', JSON.stringify({
    date: today,
    today: secondsToday
  }));
  localStorage.setItem('hebrewTotal', secondsTotal);
}

function updateStats() {
  todayMinutes.textContent = Math.floor(secondsToday / 60);
  totalMinutes.textContent = Math.floor(secondsTotal / 60);
}

// Выбираем подкаст на сегодня по дню недели
function getTodayPodcast() {
  const day = new Date().getDay();
  return PODCASTS[day % PODCASTS.length];
}

// Парсим RSS
async function loadEpisode() {
  const podcast = getTodayPodcast();
  episodeSource.textContent = podcast.name;
  episodeTitle.textContent = 'Загружаем...';

  try {
    const response = await fetch(podcast.rss);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');

    if (items.length === 0) throw new Error('Нет эпизодов');

    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const item = items[dayOfYear % items.length];

    const title = item.querySelector('title')?.textContent || 'Эпизод';
    const enclosure = item.querySelector('enclosure');
    const audioUrl = enclosure?.getAttribute('url');

    episodeTitle.textContent = title;

    if (audioUrl) {
      audio.src = audioUrl;
      audio.playbackRate = 0.65;
    } else {
      episodeTitle.textContent = 'Нет аудио в эпизоде';
    }
  } catch (e) {
    episodeTitle.textContent = 'Ошибка загрузки. Проверь интернет.';
  }
}

// Плеер
playBtn.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    playBtn.textContent = '▶';
    isPlaying = false;
    clearInterval(timer);
  } else {
    audio.play();
    playBtn.textContent = '⏸';
    isPlaying = true;
    timer = setInterval(() => {
      secondsToday++;
      secondsTotal++;
      updateStats();
      saveStats();
    }, 1000);
  }
});

// Скорость
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    audio.playbackRate = parseFloat(btn.dataset.speed);
  });
});

// Старт
loadStats();
loadEpisode();