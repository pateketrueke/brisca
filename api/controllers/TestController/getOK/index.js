export default ({ db, users }) => async function getOK(ctx) {
  const allUsers = await db.select().from(users).all();
  ctx.resp_body = { status: 'ok', result: allUsers };
};
