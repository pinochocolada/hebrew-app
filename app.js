const PODCASTS = [
  {
    name: "Hebrew Time — Надя (1)",
    rss: "/.netlify/functions/proxy?url=https://anchor.fm/s/3f7a77ec/podcast/rss",
    block: [0, 54]
  },
  {
    name: "Hebrew Time — Надя (2)",
    rss: "/.netlify/functions/proxy?url=https://anchor.fm/s/3f7a77ec/podcast/rss",
    block: [55, 109]
  },
  {
    name: "ילדי טבע — природа Израиля",
    rss: "/.netlify/functions/proxy?url=https://feed.podbean.com/omryg/feed.xml",
    block: null
  },
  {
    name: "שיר אחד — истории за песнями",
    rss: "/.netlify/functions/proxy?url=https://omny.fm/shows/one-song/playlists/podcast.rss",
    block: null
  },
  {
    name: "איך העולם עובד — как устроен мир",
    rss: "/.netlify/functions/proxy?url=https://omny.fm/shows/howitworks/playlists/podcast.rss",
    block: null
  },
  {
    name: "המעבדה לילדים — лаборатория",
    rss: "/.netlify/functions/proxy?url=https://omny.fm/shows/the-lab-for-children/playlists/podcast.rss",
    block: null
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

let currentPodcastIndex = 0;
let currentEpisodeIndex = 0;
let currentItems = [];

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

function getTodayPodcastIndex() {
  const day = new Date().getDay();
  return day % PODCASTS.length;
}

async function loadPodcast(podcastIndex) {
  const podcast = PODCASTS[podcastIndex];
  episodeSource.textContent = podcast.name;
  episodeTitle.textContent = 'Загружаем...';

  try {
    const response = await fetch(podcast.rss);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');

    if (items.length === 0) throw new Error('Нет эпизодов');

    currentItems = Array.from(items);
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    currentEpisodeIndex = dayOfYear % currentItems.length;

    loadEpisode();
  } catch (e) {
    episodeTitle.textContent = 'Ошибка загрузки. Проверь интернет.';
  }
}

function loadEpisode() {
  const item = currentItems[currentEpisodeIndex];
  const title = item.querySelector('title')?.textContent || 'Эпизод';
  const enclosure = item.querySelector('enclosure');
  const audioUrl = enclosure?.getAttribute('url');

  episodeTitle.textContent = title;

  if (audioUrl) {
    const wasPlaying = isPlaying;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      playBtn.textContent = '▶';
      clearInterval(timer);
    }
    audio.src = audioUrl;
    audio.playbackRate = parseFloat(document.querySelector('.speed-btn.active')?.dataset.speed || 0.65);
    if (wasPlaying) {
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
  } else {
    episodeTitle.textContent = 'Нет аудио в эпизоде';
  }
}

function nextEpisode() {
  if (currentItems.length === 0) return;
  currentEpisodeIndex = (currentEpisodeIndex + 1) % currentItems.length;
  loadEpisode();
}

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

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    audio.playbackRate = parseFloat(btn.dataset.speed);
  });
});

document.getElementById('next-btn').addEventListener('click', nextEpisode);

audio.addEventListener('ended', nextEpisode);

currentPodcastIndex = getTodayPodcastIndex();
loadStats();
loadPodcast(currentPodcastIndex);