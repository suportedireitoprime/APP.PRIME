const results = [{ data: null, error: { message: "Error" } }];
const allUids = Array.from(new Set(
  results.flatMap(({ data }) => ((data) || []).map(r => r.user_id || r.id)).filter(Boolean)
));
console.log('allUids:', allUids);
