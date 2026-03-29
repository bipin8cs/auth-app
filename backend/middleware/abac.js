const { Policy } = require('../models');

/**
 * ABAC Policy Evaluation Engine
 * Evaluates policies based on:
 * - User attributes (role, department, location, etc.)
 * - Resource attributes (type, owner, etc.)
 * - Environment attributes (time, ip, etc.)
 */

function evaluateCondition(conditionKey, conditionValue, context) {
  const parts = conditionKey.split('.');
  let actual = context;
  for (const part of parts) {
    if (actual === undefined || actual === null) return false;
    actual = actual[part];
  }

  if (typeof conditionValue === 'object' && conditionValue !== null) {
    // Operator-based conditions
    if ('$eq' in conditionValue) return actual === conditionValue.$eq;
    if ('$ne' in conditionValue) return actual !== conditionValue.$ne;
    if ('$gt' in conditionValue) return actual > conditionValue.$gt;
    if ('$gte' in conditionValue) return actual >= conditionValue.$gte;
    if ('$lt' in conditionValue) return actual < conditionValue.$lt;
    if ('$lte' in conditionValue) return actual <= conditionValue.$lte;
    if ('$in' in conditionValue) return conditionValue.$in.includes(actual);
    if ('$nin' in conditionValue) return !conditionValue.$nin.includes(actual);
    if ('$exists' in conditionValue) return conditionValue.$exists ? actual !== undefined : actual === undefined;
    if ('$regex' in conditionValue) return new RegExp(conditionValue.$regex).test(actual);
    return false;
  }

  // Direct equality
  return actual === conditionValue;
}

function evaluateConditions(conditions, context) {
  for (const [key, value] of Object.entries(conditions)) {
    if (!evaluateCondition(key, value, context)) {
      return false;
    }
  }
  return true;
}

async function evaluatePolicies(resource, action, context) {
  const policies = await Policy.findAll({
    where: { resource, action, isActive: true },
    order: [['effect', 'ASC']], // deny policies first
  });

  if (policies.length === 0) {
    // No policies found — default deny
    return { allowed: false, reason: 'No matching policies found' };
  }

  for (const policy of policies) {
    const conditionsMet = evaluateConditions(policy.conditions, context);

    if (conditionsMet && policy.effect === 'deny') {
      return { allowed: false, reason: `Denied by policy: ${policy.name}` };
    }

    if (conditionsMet && policy.effect === 'allow') {
      return { allowed: true, reason: `Allowed by policy: ${policy.name}` };
    }
  }

  return { allowed: false, reason: 'No matching policy conditions met' };
}

// ABAC middleware
const requirePolicy = (resource, action, getContext) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRoles = req.user.roles.map((r) => r.name);
    // Admin bypass
    if (userRoles.includes('admin')) {
      return next();
    }

    const context = {
      user: {
        id: req.user.id,
        email: req.user.email,
        roles: userRoles,
        department: req.user.department,
        location: req.user.location,
        isActive: req.user.isActive,
      },
      resource: getContext ? getContext(req) : {},
      environment: {
        time: new Date().toISOString(),
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        ip: req.ip,
        method: req.method,
      },
    };

    const result = await evaluatePolicies(resource, action, context);

    if (!result.allowed) {
      return res.status(403).json({
        message: 'Access denied by policy',
        reason: result.reason,
      });
    }

    next();
  };
};

module.exports = { evaluatePolicies, requirePolicy, evaluateConditions };
