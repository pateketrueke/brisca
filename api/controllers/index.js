export default async Grown => {
  return Grown('Handlers', {
    include: await Promise.all([
      Grown.load(import.meta.url),
    ]),
  });
};
