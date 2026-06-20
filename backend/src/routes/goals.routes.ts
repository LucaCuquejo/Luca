import { Router, Response } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';

const router = Router();

const FREE_GOAL_LIMIT = 3;

// GET /goals/templates
router.get('/templates', requireAuth, async (req, res: Response) => {
  const category = req.query.category as string | undefined;

  const result = await query(
    `SELECT id, category, title, description, level, duration_minutes, xp_reward
     FROM goal_templates
     WHERE is_active = true ${category ? 'AND category = $1' : ''}
     ORDER BY category, level`,
    category ? [category] : []
  );

  res.json({ templates: result.rows });
});

// GET /goals
router.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  const result = await query(
    `SELECT id, category, title, description, current_level, target_level,
            is_custom, is_active, current_streak, longest_streak,
            total_completions, last_completed_at, started_at
     FROM user_goals
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [authReq.userId]
  );

  res.json({ goals: result.rows });
});

// POST /goals
router.post(
  '/',
  requireAuth,
  [
    body('category').isIn(['smoking', 'exercise', 'social', 'mental_wellbeing', 'nutrition', 'sleep', 'alcohol', 'custom']),
    body('title').trim().isLength({ min: 3, max: 100 }),
    body('template_id').optional().isUUID(),
    body('is_custom').optional().isBoolean(),
  ],
  async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errors.array() });
    }

    const authReq = req as AuthenticatedRequest;

    // Check free tier limit
    if (authReq.subscriptionTier === 'free') {
      const countResult = await query(
        `SELECT COUNT(*) as count FROM user_goals WHERE user_id = $1 AND is_active = true`,
        [authReq.userId]
      );
      if (Number(countResult.rows[0].count) >= FREE_GOAL_LIMIT) {
        return res.status(403).json({
          error: 'limit_reached',
          message: `Free plan allows up to ${FREE_GOAL_LIMIT} active goals. Upgrade to Premium for unlimited goals.`,
        });
      }
    }

    const { template_id, category, title, is_custom = false } = req.body;
    let description: string | null = null;

    if (template_id) {
      const tmpl = await query(
        `SELECT description FROM goal_templates WHERE id = $1`,
        [template_id]
      );
      description = tmpl.rows[0]?.description ?? null;
    }

    const result = await query(
      `INSERT INTO user_goals (user_id, template_id, category, title, description, is_custom)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [authReq.userId, template_id ?? null, category, title, description, is_custom]
    );

    res.status(201).json({ goal: result.rows[0] });
  }
);

// POST /goals/:id/complete
router.post(
  '/:id/complete',
  requireAuth,
  [
    param('id').isUUID(),
    body('note').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const goalId = req.params.id;

    const goalResult = await query(
      `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
      [goalId, authReq.userId]
    );

    if (goalResult.rowCount === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    const goal = goalResult.rows[0];

    // Check if already completed today
    const todayCompletion = await query(
      `SELECT id FROM goal_completions
       WHERE goal_id = $1 AND completed_at::date = CURRENT_DATE`,
      [goalId]
    );

    if (todayCompletion.rowCount > 0) {
      return res.status(400).json({ error: 'already_completed', message: 'Already completed today' });
    }

    // Calculate streak
    const lastCompleted = goal.last_completed_at ? new Date(goal.last_completed_at) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastCompleted
      ? lastCompleted.toDateString() === yesterday.toDateString()
      : false;

    const newStreak = isConsecutive ? goal.current_streak + 1 : 1;
    const longestStreak = Math.max(goal.longest_streak, newStreak);
    const xpReward = 10 + newStreak; // bonus XP for streaks

    // Check for level up (3+ consecutive days at current level)
    const recentCompletions = await query(
      `SELECT COUNT(*) as count FROM goal_completions
       WHERE goal_id = $1 AND level = $2
         AND completed_at > NOW() - INTERVAL '7 days'`,
      [goalId, goal.current_level]
    );

    const levelUp =
      Number(recentCompletions.rows[0].count) >= 2 &&
      newStreak >= 3 &&
      goal.current_level < goal.target_level;

    const newLevel = levelUp ? goal.current_level + 1 : goal.current_level;

    // Store completion
    const completionResult = await query(
      `INSERT INTO goal_completions (user_id, goal_id, level, note, xp_earned)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [authReq.userId, goalId, goal.current_level, req.body.note ?? null, xpReward]
    );

    // Update goal
    await query(
      `UPDATE user_goals
       SET current_streak = $2, longest_streak = $3, total_completions = total_completions + 1,
           last_completed_at = NOW(), current_level = $4
       WHERE id = $1`,
      [goalId, newStreak, longestStreak, newLevel]
    );

    // Update XP
    await query(
      `UPDATE user_xp SET total_xp = total_xp + $2 WHERE user_id = $1`,
      [authReq.userId, xpReward]
    );

    // Check milestones
    const milestoneEarned = await checkGoalMilestones(authReq.userId, newStreak);

    const celebrationMessages = [
      `${newStreak}-day streak! You're building a real habit.`,
      'Another one done! Small steps, real progress.',
      `${newStreak} days in a row. That's no accident — that's dedication.`,
      'Done! Every completion counts, even on hard days.',
    ];

    res.json({
      completion_id: completionResult.rows[0].id,
      xp_earned: xpReward,
      new_streak: newStreak,
      level_up: levelUp,
      milestone_earned: milestoneEarned,
      celebration_message: levelUp
        ? `Level ${newLevel} unlocked! You're ready for a bigger challenge.`
        : celebrationMessages[newStreak % celebrationMessages.length],
    });
  }
);

// PUT /goals/:id
router.put(
  '/:id',
  requireAuth,
  [param('id').isUUID()],
  async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { is_active, current_level } = req.body;

    await query(
      `UPDATE user_goals
       SET is_active = COALESCE($3, is_active),
           current_level = COALESCE($4, current_level),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, authReq.userId, is_active, current_level]
    );

    res.json({ success: true });
  }
);

async function checkGoalMilestones(
  userId: string,
  streak: number
): Promise<string | null> {
  const milestoneKeys: Record<number, string> = {
    3: 'streak_3',
    7: 'streak_7',
    30: 'streak_30',
  };

  const key = milestoneKeys[streak];
  if (!key) return null;

  const milestone = await query(
    `SELECT id FROM milestones WHERE key = $1`,
    [key]
  );

  if (milestone.rowCount === 0) return null;

  const milestoneId = milestone.rows[0].id;

  const existing = await query(
    `SELECT id FROM user_milestones WHERE user_id = $1 AND milestone_id = $2`,
    [userId, milestoneId]
  );

  if (existing.rowCount > 0) return null;

  await query(
    `INSERT INTO user_milestones (user_id, milestone_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, milestoneId]
  );

  await query(
    `UPDATE user_xp SET total_xp = total_xp + (SELECT xp_reward FROM milestones WHERE id = $2)
     WHERE user_id = $1`,
    [userId, milestoneId]
  );

  const m = await query(`SELECT title FROM milestones WHERE id = $1`, [milestoneId]);
  return m.rows[0]?.title ?? null;
}

export default router;
