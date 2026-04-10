import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const PROVIDERS = ['google', 'facebook', 'apple'];

function callbackUrl(provider) {
  return `${process.env.BASE_URL}/api/auth/social/${provider}/callback`;
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
  if (!PROVIDERS.includes(provider)) {
    throw new Error('Unsupported provider');
  }
}

function assertSocialConfig(provider) {
  const map = {
    google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    facebook: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
    apple: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
  };
  const missing = (map[provider] || []).filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing ${provider} OAuth env vars: ${missing.join(', ')}`);
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
    assertSocialConfig(provider);
    const state = crypto.randomBytes(12).toString('hex');

    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl('google'),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
      });
      return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    }

    if (provider === 'facebook') {
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID,
        redirect_uri: callbackUrl('facebook'),
        response_type: 'code',
        scope: 'email,public_profile',
        state,
      });
      return res.redirect(`https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`);
    }

    const params = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID,
      redirect_uri: callbackUrl('apple'),
      response_type: 'code',
      response_mode: 'query',
      scope: 'name email',
      state,
    });
    return res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
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
      redirect_uri: callbackUrl('google'),
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

export async function facebookCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    if (error) return uiRedirectWithError(res, `Facebook auth failed: ${error}`);
    if (!code) return uiRedirectWithError(res, 'Facebook auth code missing');

    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
      redirect_uri: callbackUrl('facebook'),
      code,
    });
    const tokenResp = await fetch(`https://graph.facebook.com/v22.0/oauth/access_token?${tokenParams.toString()}`);
    if (!tokenResp.ok) throw new Error('Facebook token exchange failed');
    const tokenJson = await tokenResp.json();

    const profileResp = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tokenJson.access_token)}`
    );
    if (!profileResp.ok) throw new Error('Facebook profile fetch failed');
    const profile = await profileResp.json();

    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
    });
    const token = signToken(user._id.toString());
    return uiRedirectWithAuth(res, token, { id: user._id.toString(), email: user.email, name: user.name });
  } catch (e) {
    return next(e);
  }
}

function buildAppleClientSecret() {
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    issuer: process.env.APPLE_TEAM_ID,
    audience: 'https://appleid.apple.com',
    subject: process.env.APPLE_CLIENT_ID,
    expiresIn: '5m',
    keyid: process.env.APPLE_KEY_ID,
  });
}

export async function appleCallback(req, res, next) {
  try {
    const code = req.body?.code || req.query?.code;
    const err = req.body?.error || req.query?.error;
    if (err) return uiRedirectWithError(res, `Apple auth failed: ${err}`);
    if (!code) return uiRedirectWithError(res, 'Apple auth code missing');

    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl('apple'),
      client_id: process.env.APPLE_CLIENT_ID,
      client_secret: buildAppleClientSecret(),
    });
    const tokenResp = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });
    if (!tokenResp.ok) throw new Error('Apple token exchange failed');
    const tokenJson = await tokenResp.json();
    const claims = jwt.decode(tokenJson.id_token);
    if (!claims || claims.iss !== 'https://appleid.apple.com') {
      throw new Error('Invalid Apple identity token');
    }

    const user = await findOrCreateSocialUser({
      provider: 'apple',
      providerId: claims.sub,
      email: claims.email,
      name: '',
    });

    const token = signToken(user._id.toString());
    return uiRedirectWithAuth(res, token, { id: user._id.toString(), email: user.email, name: user.name });
  } catch (e) {
    return next(e);
  }
}
