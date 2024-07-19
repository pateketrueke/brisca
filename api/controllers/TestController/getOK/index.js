export default ({ db, users }) => async function getOK(ctx) {
  const allUsers = await db.select().from(users).all();
  ctx.res.write(JSON.stringify({ status: 'ok', result: allUsers }));
};
