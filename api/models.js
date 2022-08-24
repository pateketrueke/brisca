export default function Models(Grown) {
  return Grown('Models', {
    connect() {
      return Promise.resolve();
    },
    models: {},
  });
}
