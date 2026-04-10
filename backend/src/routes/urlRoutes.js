import { Router } from 'express';
import { body } from 'express-validator';
import {
  shorten,
  getByCode,
  listMine,
  remove,
  analytics,
} from '../controllers/urlController.js';
import { requireAuth } from '../middleware/auth.js';
import { shortenLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * Order matters: static path segments before `/:code` wildcard.
 */
router.post(
  '/shorten',
  requireAuth,
  shortenLimiter,
  body('url').trim().notEmpty().isLength({ max: 2048 }),
  body('customCode').optional().isString(),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().toDate(),
  shorten
);

router.get('/user/all', requireAuth, listMine);
router.get('/analytics/:id', requireAuth, analytics);
router.delete('/:id', requireAuth, remove);
router.get('/:code', getByCode);

export default router;
