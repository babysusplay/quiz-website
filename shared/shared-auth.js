/*
 * Shared account layer for the Main Hub + Quiz + Drawzy + Puzzle.
 *
 * IMPORTANT:
 * - All surfaces use the same Supabase Auth session.
 * - All surfaces use the same public.profiles row.
 * - A game must never create its own login/profile system.
 */
(function (global) {
  const shared = {
    supabase: null,
    _authSubscription: null,

    init(client) {
      this.supabase = client;
      return this;
    },

    assertReady() {
      if (!this.supabase) {
        throw new Error('Shared auth is not initialized.');
      }
    },

    async getSession() {
      this.assertReady();
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    },

    async getUser() {
      this.assertReady();
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    },

    async getProfile(userId) {
      this.assertReady();
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

    async ensureProfile(user = null) {
      this.assertReady();
      const currentUser = user || (await this.getUser());
      if (!currentUser) return null;

      const metadata = currentUser.user_metadata || {};
      const provider =
        currentUser.app_metadata?.provider ||
        currentUser.identities?.[0]?.provider ||
        metadata.provider ||
        null;

      const displayName =
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        currentUser.email?.split('@')[0] ||
        'Player';

      const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        null;

      const payload = {
        id: currentUser.id,
        user_id: currentUser.id,
        display_name: displayName,
        email: currentUser.email || null,
        provider,
        avatar_url: avatarUrl
      };

      const { data, error } = await this.supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('id,user_id,display_name,email,provider,avatar_url,discord_user_id,created_at')
        .single();

      if (error) throw error;
      return data;
    },

    async getAccount() {
      const user = await this.getUser();
      if (!user) return { user: null, profile: null };

      let profile = await this.getProfile(user.id);
      if (!profile) {
        profile = await this.ensureProfile(user);
      }

      return { user, profile };
    },

    async requireUser() {
      const user = await this.getUser();
      if (!user) throw new Error('LOGIN_REQUIRED');
      return user;
    },

    onAuthChange(callback) {
      this.assertReady();
      if (this._authSubscription) {
        this._authSubscription.unsubscribe();
      }
      const result = this.supabase.auth.onAuthStateChange(callback);
      this._authSubscription = result.data?.subscription || null;
      return result;
    },

    async signOut() {
      this.assertReady();
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    }
  };

  global.SharedAccount = shared;
})(window);
