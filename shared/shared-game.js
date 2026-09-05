/*
 * Shared game data API for Quiz, Drawzy and Puzzle.
 *
 * Usage after SharedAccount.init(supabaseClient):
 *   SharedGame.init(supabaseClient);
 *   await SharedGame.recordScore('quiz', 120, { quizId: 'ABC123' });
 *   await SharedGame.getLeaderboard('drawzy', 20);
 */
(function (global) {
  const VALID_GAMES = new Set(['quiz', 'drawzy', 'puzzle']);

  const api = {
    supabase: null,

    init(client) {
      this.supabase = client;
      return this;
    },

    assertReady() {
      if (!this.supabase) {
        throw new Error('Shared game API is not initialized.');
      }
    },

    assertGame(gameType) {
      if (!VALID_GAMES.has(gameType)) {
        throw new Error(`Unknown game type: ${gameType}`);
      }
    },

    async recordScore(gameType, score, metadata = {}) {
      this.assertReady();
      this.assertGame(gameType);

      const user = await global.SharedAccount?.requireUser?.();
      if (!user) throw new Error('LOGIN_REQUIRED');

      const numericScore = Number(score);
      if (!Number.isFinite(numericScore)) {
        throw new Error('INVALID_SCORE');
      }

      const safeMetadata =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? metadata
          : {};

      const { data, error } = await this.supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score: Math.trunc(numericScore),
          metadata: safeMetadata
        })
        .select('id,user_id,game_type,score,metadata,created_at')
        .single();

      if (error) throw error;
      return data;
    },

    async getLeaderboard(gameType, limit = 100) {
      this.assertReady();
      this.assertGame(gameType);

      const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 100));
      const { data, error } = await this.supabase.rpc('get_game_leaderboard', {
        requested_game: gameType,
        result_limit: safeLimit
      });

      if (error) throw error;
      return data || [];
    },

    async getMyScores(gameType, limit = 50) {
      this.assertReady();
      this.assertGame(gameType);

      const user = await global.SharedAccount?.requireUser?.();
      if (!user) throw new Error('LOGIN_REQUIRED');

      const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
      const { data, error } = await this.supabase
        .from('game_scores')
        .select('id,game_type,score,metadata,created_at')
        .eq('user_id', user.id)
        .eq('game_type', gameType)
        .order('created_at', { ascending: false })
        .limit(safeLimit);

      if (error) throw error;
      return data || [];
    }
  };

  global.SharedGame = api;
})(window);
