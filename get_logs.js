const url = 'https://api.github.com/repos/suportedireitoprime/APP.PRIME/actions/runs?branch=main&per_page=1';
fetch(url)
  .then(r => r.json())
  .then(d => {
    const runId = d.workflow_runs[0].id;
    console.log('Run ID:', runId);
    return fetch(`https://api.github.com/repos/suportedireitoprime/APP.PRIME/actions/runs/${runId}/jobs`);
  })
  .then(r => r.json())
  .then(j => {
    const job = j.jobs[0];
    console.log('Job ID:', job.id);
    return fetch(`https://api.github.com/repos/suportedireitoprime/APP.PRIME/actions/jobs/${job.id}/logs`);
  })
  .then(r => r.text())
  .then(log => {
    const lines = log.split('\n');
    console.log('--- LOG END ---');
    console.log(lines.slice(-100).join('\n'));
  });
