/*
 * Main Hub game registry.
 * Keep each game in its own folder/repository. The Hub only knows where to open it.
 */
(function (global) {
  const games = [
    {
      id: 'quiz',
      name: 'Quiz',
      icon: '🧠',
      description: 'Create quizzes, play them, and track your score.',
      url: '../index.html',
      status: 'live'
    },
    {
      id: 'drawzy',
      name: 'Drawzy',
      icon: '🎨',
      description: 'Draw, guess, chat, and compete with other players.',
      url: '#',
      status: 'coming-soon'
    },
    {
      id: 'puzzle',
      name: 'Puzzle',
      icon: '🧩',
      description: 'Solve random puzzles and climb the leaderboard.',
      url: '#',
      status: 'coming-soon'
    }
  ];

  global.GameRegistry = {
    all() {
      return games.map(game => ({ ...game }));
    },
    get(id) {
      const game = games.find(item => item.id === id);
      return game ? { ...game } : null;
    }
  };
})(window);
