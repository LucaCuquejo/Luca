import { Router, Response } from 'express';
import { param } from 'express-validator';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import {
  createManualSOSEvent,
  markCallInitiated,
  markContactNotified,
  markCrisisDismissed,
} from '../services/crisis.service';

const router = Router();

// POST /crisis/sos — manual SOS trigger
router.post('/sos', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const { eventId, resource } = await createManualSOSEvent(
      authReq.userId,
      authReq.countryCode
    );

    res.json({
      crisis_event_id: eventId,
      crisis_resource: {
        organization: resource?.organization,
        hotline_display: resource?.hotline_display,
        hotline_number: resource?.hotline_number,
        available_hours: resource?.available_hours,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /crisis/resources
router.get('/resources', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  const resources = await query(
    `SELECT * FROM crisis_resources WHERE country_code = $1 ORDER BY is_primary DESC`,
    [authReq.countryCode]
  );

  const primary = resources.rows.find((r) => r.is_primary);
  const additional = resources.rows.filter((r) => !r.is_primary);

  res.json({ primary, additional });
});

// POST /crisis/:id/call-initiated
router.post(
  '/:id/call-initiated',
  requireAuth,
  [param('id').isUUID()],
  async (req, res: Response) => {
    await markCallInitiated(req.params.id);
    res.json({ success: true });
  }
);

// POST /crisis/:id/contact-notified
router.post(
  '/:id/contact-notified',
  requireAuth,
  [param('id').isUUID()],
  async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    await markContactNotified(req.params.id, authReq.userId);
    res.json({ success: true });
  }
);

// POST /crisis/:id/dismissed
router.post(
  '/:id/dismissed',
  requireAuth,
  [param('id').isUUID()],
  async (req, res: Response) => {
    await markCrisisDismissed(req.params.id);
    res.json({ success: true });
  }
);

export default router;
