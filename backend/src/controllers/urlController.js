import { validationResult } from 'express-validator';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import { Url } from '../models/Url.js';
import { ClickEvent } from '../models/ClickEvent.js';
import { generateShortCode } from '../utils/shortCode.js';
import { isValidHttpUrl, isValidCustomCode } from '../utils/urlValidation.js';

function baseUrl() {
  return (process.env.BASE_URL || '').replace(/\/$/, '');
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export async function shorten(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { url, customCode, expiresAt } = req.body;
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ message: 'URL must be a valid http(s) URL' });
    }
    if (!isValidCustomCode(customCode)) {
      return res.status(400).json({
        message: 'Custom code must be 3–32 chars: letters, numbers, dash, underscore',
      });
    }

    let shortCode;
    let isCustomSlug = false;
    if (customCode && String(customCode).trim()) {
      shortCode = String(customCode).trim();
      isCustomSlug = true;
      const taken = await Url.findOne({ shortCode });
      if (taken) {
        return res.status(409).json({ message: 'This short code is already taken' });
      }
    } else {
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        const exists = await Url.findOne({ shortCode });
        if (!exists) break;
        attempts += 1;
      } while (attempts < 10);
      if (attempts >= 10) {
        return res.status(500).json({ message: 'Could not generate unique code, retry' });
      }
    }

    let expiryDate = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({ message: 'Invalid expiresAt date' });
      }
      if (expiryDate.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'expiresAt must be in the future' });
      }
    }

    const doc = await Url.create({
      originalUrl: url,
      shortCode,
      userId: req.user.id,
      isCustomSlug,
      expiresAt: expiryDate,
    });

    const shortUrl = `${baseUrl()}/${doc.shortCode}`;
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(shortUrl, { width: 200, margin: 1 });
    } catch (qrErr) {
      console.warn('QR generation failed', qrErr);
    }

    res.status(201).json({
      id: doc._id.toString(),
      originalUrl: doc.originalUrl,
      shortCode: doc.shortCode,
      shortUrl,
      qrDataUrl,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    next(e);
  }
}

/** GET /api/url/:code — metadata for a short code (optional discovery). */
export async function getByCode(req, res, next) {
  try {
    const { code } = req.params;
    const doc = await Url.findOne({ shortCode: code });
    if (!doc) {
      return res.status(404).json({ message: 'Short URL not found' });
    }
    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ message: 'This link has expired' });
    }
    res.json({
      shortCode: doc.shortCode,
      originalUrl: doc.originalUrl,
      clickCount: doc.clickCount,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    next(e);
  }
}

export async function listMine(req, res, next) {
  try {
    const urls = await Url.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const b = baseUrl();
    const items = urls.map((u) => ({
      id: u._id.toString(),
      originalUrl: u.originalUrl,
      shortCode: u.shortCode,
      shortUrl: `${b}/${u.shortCode}`,
      clickCount: u.clickCount,
      expiresAt: u.expiresAt,
      isCustomSlug: u.isCustomSlug,
      createdAt: u.createdAt,
    }));
    res.json({ urls: items });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid URL id' });
    }
    const doc = await Url.findOne({ _id: id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'URL not found' });
    }
    await ClickEvent.deleteMany({ urlId: doc._id });
    await doc.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
}

/**
 * Analytics: totals + clicks grouped by day for charts.
 * Query: ?days=30 (default 30)
 */
export async function analytics(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid URL id' });
    }
    const urlDoc = await Url.findOne({ _id: id, userId: req.user.id });
    if (!urlDoc) {
      return res.status(404).json({ message: 'URL not found' });
    }

    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    start.setUTCHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          urlId: urlDoc._id,
          clickedAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clickedAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const byDay = await ClickEvent.aggregate(pipeline);
    const totalClicks = urlDoc.clickCount;

    res.json({
      url: {
        id: urlDoc._id.toString(),
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        shortUrl: `${baseUrl()}/${urlDoc.shortCode}`,
        createdAt: urlDoc.createdAt,
        expiresAt: urlDoc.expiresAt,
      },
      totalClicks,
      clicksInRange: byDay.reduce((s, d) => s + d.count, 0),
      clicksOverTime: byDay.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (e) {
    next(e);
  }
}

/** Public redirect handler: GET /:code */
const RESERVED_PATHS = new Set(['favicon.ico', 'robots.txt']);

export async function redirectByCode(req, res, next) {
  try {
    const { code } = req.params;
    if (!code || code.includes('/') || code.length > 64 || RESERVED_PATHS.has(code.toLowerCase())) {
      return res.status(404).send(renderErrorPage(404, 'Not found', 'Invalid or missing short link.'));
    }
    const doc = await Url.findOne({ shortCode: code });
    if (!doc) {
      return res.status(404).send(renderErrorPage(404, 'Link not found', 'This short URL does not exist.'));
    }
    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) {
      return res.status(410).send(renderErrorPage(410, 'Link expired', 'This short URL is no longer valid.'));
    }

    doc.clickCount += 1;
    await doc.save();
    await ClickEvent.create({
      urlId: doc._id,
      clickedAt: new Date(),
      ip: clientIp(req),
      userAgent: req.get('user-agent') || null,
    });

    res.redirect(302, doc.originalUrl);
  } catch (e) {
    next(e);
  }
}

function renderErrorPage(status, title, message) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;margin:0;}
  .box{background:#1e293b;padding:2rem;border-radius:12px;max-width:420px;text-align:center;}
  h1{font-size:1.25rem;margin:0 0 0.5rem;}p{color:#94a3b8;margin:0;}</style></head>
  <body><div class="box"><h1>${title}</h1><p>${message}</p><p style="margin-top:1rem;font-size:0.85rem;">${status}</p></div></body></html>`;
}
