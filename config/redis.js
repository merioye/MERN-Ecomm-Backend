const { createClient } = require("redis");

const options = {
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
};
const redisClient = createClient(options);

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient
  .connect()
  .then(() => {
    console.log("Redis client connected to redis server successfully");
  })
  .catch((e) => {
    console.log(e);
  });

module.exports = redisClient;
