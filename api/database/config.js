export default (env, baseDir) => {
  const config = {
    timeout: 1000,
    directory: baseDir,
    seederStorage: 'sequelize',
    migrations: {
      database: true,
    },
  };

  if (!env.DB_SOURCE) {
    config.storage = `${baseDir}/dev.sqlite`;
    config.dialect = 'sqlite';
  } else {
    config.connection = env[env.DB_SOURCE];
  }

  if (env.DB_SECURE === 'YES') {
    config.ssl = true;
    config.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return config;
};
