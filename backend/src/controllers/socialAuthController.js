import crypto from 'crypto';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

function callbackUrl() {
  return `${process.env.BASE_URL}/api/auth/social/google/callback`;
}

function uiRedirectWithAuth(res, token, user) {
  const params = new URLSearchParams({
    token,
    user: JSON.stringify(user),
  });
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?${params.toString()}`);
}

function uiRedirectWithError(res, message) {
  const params = new URLSearchParams({ error: message });
  res.redirect(`${process.env.CLIENT_URL}/login?${params.toString()}`);
}

function ensureProvider(provider) {
  if (provider !== 'google') {
    throw new Error('Unsupported provider');
  }
}

function assertSocialConfig() {
  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing google OAuth env vars: ${missing.join(', ')}`);
  }
}

async function findOrCreateSocialUser({ provider, providerId, email, name }) {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('Provider did not return an email');
  }

  let user = await User.findOne({
    $or: [{ authProvider: provider, providerId }, { email: normalizedEmail }],
  });

  if (!user) {
    user = await User.create({
      name: name || '',
      email: normalizedEmail,
      authProvider: provider,
      providerId,
    });
  } else {
    let changed = false;
    if (!user.providerId) {
      user.providerId = providerId;
      user.authProvider = provider;
      changed = true;
    }
    if (!user.name && name) {
      user.name = name;
      changed = true;
    }
    if (changed) await user.save();
  }

  return user;
}

export function socialAuthStart(req, res, next) {
  try {
    const { provider } = req.params;
    ensureProvider(provider);
    assertSocialConfig();
    const state = crypto.randomBytes(12).toString('hex');

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: callbackUrl(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (e) {
    return next(e);
  }
}

export async function googleCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    if (error) return uiRedirectWithError(res, `Google auth failed: ${error}`);
    if (!code) return uiRedirectWithError(res, 'Google auth code missing');

    const tokenBody = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl(),
      grant_type: 'authorization_code',
    });
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });
    if (!tokenResp.ok) throw new Error('Google token exchange failed');
    const tokenJson = await tokenResp.json();

    const profileResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileResp.ok) throw new Error('Google profile fetch failed');
    const profile = await profileResp.json();

    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
    });

    const token = signToken(user._id.toString());
    return uiRedirectWithAuth(res, token, { id: user._id.toString(), email: user.email, name: user.name });
  } catch (e) {
    return next(e);
  }
}
