const { createClient } = require('redis');

const redisClient = createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(()=>{
    console.log('Redis client connected to redis server successfully');
})
.catch((e)=>{
    console.log(e);
});

module.exports = redisClient;