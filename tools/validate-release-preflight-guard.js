const fs = require('fs');
const path = require('path');

const AUTHORIZED_ACTORS = {
  staging: new Set(['foreverwow001']),
  production: new Set(['foreverwow001']),
};

const CHECKLIST_PATH = path.join(
  process.cwd(),
  'doc/architecture/flows/production_backup_restore_signoff_checklist.md',
);

function resolveEffectiveActor() {
  const triggeringActor = (process.env.GITHUB_TRIGGERING_ACTOR || '').trim();
  const actor = (process.env.GITHUB_ACTOR || '').trim();

  return {
    triggeringActor,
    actor,
    effectiveActor: triggeringActor || actor,
    actorSource: triggeringActor ? 'github.triggering_actor' : 'github.actor',
  };
}

function escapeSummaryValue(value) {
  return String(value || '')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`/g, '\\`');
}

function escapeLogValue(value) {
  return String(value || '')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function readProductionPromotionDecision() {
  try {
    const checklist = fs.readFileSync(CHECKLIST_PATH, 'utf8');
    const match = checklist.match(/\|\s*可允許 production promote\s*\|\s*`?([a-zA-Z]+)`?\s*\|/);

    if (!match) {
      return {
        checklistPath: CHECKLIST_PATH,
        rawValue: 'missing',
        denyReason: `production checklist deny: ${CHECKLIST_PATH} missing 可允許 production promote row`,
      };
    }

    return {
      checklistPath: CHECKLIST_PATH,
      rawValue: match[1].toLowerCase(),
    };
  } catch (error) {
    return {
      checklistPath: CHECKLIST_PATH,
      rawValue: 'read-error',
      denyReason: `production checklist deny: unable to read ${CHECKLIST_PATH} (${error.code || error.name || 'UNKNOWN'})`,
    };
  }
}

function appendSummary(result) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (!summaryPath) {
    return { status: 'not-configured' };
  }

  const lines = [
    '## Release Preflight Guard Summary',
    '',
    '| Field | Value |',
    '|---|---|',
    `| github.triggering_actor | ${escapeSummaryValue(result.triggeringActor || '(missing)')} |`,
    `| github.actor | ${escapeSummaryValue(result.actor || '(missing)')} |`,
    `| effective_actor | ${escapeSummaryValue(result.effectiveActor || '(missing)')} |`,
    `| actor_source | ${escapeSummaryValue(result.actorSource)} |`,
    `| target_environment | ${escapeSummaryValue(result.targetEnvironment || '(missing)')} |`,
    `| assignment_ref | ${escapeSummaryValue(result.assignmentRef || '(blank)')} |`,
    `| decision | ${result.allowed ? 'allow' : 'deny'} |`,
  ];

  if (result.productionChecklistDecision) {
    lines.push(
      `| production_checklist_decision | ${escapeSummaryValue(result.productionChecklistDecision)} |`,
    );
  }

  lines.push('', '### Guard Notes', '');

  if (result.reasons.length === 0) {
    lines.push('- Guard passed.');
  } else {
    for (const reason of result.reasons) {
      lines.push(`- ${escapeSummaryValue(reason)}`);
    }
  }

  try {
    fs.appendFileSync(summaryPath, `${lines.join('\n')}\n`);
    return {
      status: 'written',
      path: summaryPath,
    };
  } catch (error) {
    return {
      status: 'write-failed',
      path: summaryPath,
      code: error.code || error.name || 'UNKNOWN',
    };
  }
}

function main() {
  const targetEnvironment = (process.env.TARGET_ENVIRONMENT || '').trim();
  const assignmentRef = (process.env.ASSIGNMENT_REF || '').trim();
  const { triggeringActor, actor, effectiveActor, actorSource } = resolveEffectiveActor();
  const reasons = [];

  if (!AUTHORIZED_ACTORS[targetEnvironment]) {
    reasons.push(`unsupported target environment: ${targetEnvironment || '(missing)'}`);
  }

  if (!assignmentRef) {
    reasons.push('assignment_ref is required and cannot be blank');
  }

  if (!effectiveActor) {
    reasons.push('effective actor is missing from github.triggering_actor and github.actor');
  } else if (AUTHORIZED_ACTORS[targetEnvironment] && !AUTHORIZED_ACTORS[targetEnvironment].has(effectiveActor)) {
    reasons.push(`actor ${effectiveActor} is not authorized for ${targetEnvironment}`);
  }

  let productionChecklistDecision = '';
  if (targetEnvironment === 'production') {
    const checklistDecision = readProductionPromotionDecision();
    productionChecklistDecision = checklistDecision.rawValue;

    if (checklistDecision.denyReason) {
      reasons.push(checklistDecision.denyReason);
    } else if (checklistDecision.rawValue !== 'pass') {
      reasons.push(
        `production checklist deny: ${checklistDecision.checklistPath} reports 可允許 production promote = ${checklistDecision.rawValue}`,
      );
    }
  }

  const result = {
    triggeringActor,
    actor,
    effectiveActor,
    actorSource,
    targetEnvironment,
    assignmentRef,
    allowed: reasons.length === 0,
    reasons,
    productionChecklistDecision,
  };

  const summaryWriteResult = appendSummary(result);

  if (summaryWriteResult.status === 'write-failed') {
    console.error(
      `release-preflight guard: summary write skipped: path=${escapeLogValue(summaryWriteResult.path)} code=${escapeLogValue(summaryWriteResult.code)}`,
    );
  }

  if (!result.allowed) {
    for (const reason of reasons) {
      console.error(`release-preflight guard: ${reason}`);
    }
    process.exit(1);
  }

  console.log(
    `release-preflight guard passed: actor=${effectiveActor} target_environment=${targetEnvironment} assignment_ref=${escapeLogValue(assignmentRef)}`,
  );
}

main();