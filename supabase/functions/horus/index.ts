import { createRouter } from '../_shared/fnRouter.ts';
import { handler as admin } from './admin.ts';
import { handler as campaign_run } from './campaign-run.ts';
import { handler as click } from './click.ts';
import { handler as complemento } from './complemento.ts';
import { handler as proactive_scheduler } from './proactive-scheduler.ts';
import { handler as send_manual } from './send-manual.ts';
import { handler as stats_sync } from './stats-sync.ts';
import { handler as verify } from './verify.ts';
import { handler as webhook } from './webhook.ts';

const router = createRouter({
  'admin': admin,
  'campaign-run': campaign_run,
  'click': click,
  'complemento': complemento,
  'proactive-scheduler': proactive_scheduler,
  'send-manual': send_manual,
  'stats-sync': stats_sync,
  'verify': verify,
  'webhook': webhook,
});

Deno.serve(router);
