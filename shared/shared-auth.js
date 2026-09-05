/*
 * Drawzy / Quiz / Puzzle shared account layer
 *
 * All game surfaces use the same Supabase Auth session and the same
 * public.profiles row. Do not create a second login system for a game.
 */
(function (global) {
  const shared = {
    supabase: null,

    init(client) {
      this.supabase = client;
      return this;
    },

    async getSession() {
      if (!this.supabase) throw new Error('Shared auth is not initialized.');
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    },

    async getUser() {
      if (!this.supabase) throw new Error('Shared auth is not initialized.');
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    },

    async getProfile(userId) {
      if (!this.supabase) throw new Error('Shared auth is not initialized.');
      const user = userId || (await this.getUser())?.id;
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('profiles')
        .select('id,user_id,display_name,email,provider,avatar_url,discord_user_id,created_at')
        .eq('id', user)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },

    async requireUser() {
      const user = await this.getUser();
      if (!user) {
        throw new Error('LOGIN_REQUIRED');
      }
      return user;
    },

    onAuthChange(callback) {
      if (!this.supabase) throw new Error('Shared auth is not initialized.');
      return this.supabase.auth.onAuthStateChange(callback);
    },

    async signOut() {
      if (!this.supabase) throw new Error('Shared auth is not initialized.');
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    }
  };

  global.SharedAccount = shared;
})(window);
