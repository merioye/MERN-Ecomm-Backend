const redisClient = require("../config/redis");

class RedisService {
    pushValueToList = async (key, value, atEnd) => {
        try {
            if (atEnd) {
                await redisClient.RPUSH(key, JSON.stringify(value));
            } else {
                await redisClient.LPUSH(key, JSON.stringify(value));
            }
        } catch (e) {
            throw e;
        }
    };

    getValuesFromList = async (key, toSkip, toFetch, search) => {
        try {
            let values;
            let matchedCount;
            if (search) {
                const stringifyValues = await redisClient.LRANGE(key, 0, -1);
                const parsedValues = stringifyValues.map((val) =>
                    JSON.parse(val)
                );
                const matchedValues = parsedValues.filter((val) =>
                    val.name.toLowerCase().includes(search.toLowerCase())
                );
                values = matchedValues.slice(toSkip, toSkip + toFetch);
                matchedCount = matchedValues.length;
            } else {
                const stringifyValues = await redisClient.LRANGE(
                    key,
                    toSkip,
                    toSkip + toFetch - 1
                );
                values = stringifyValues.map((val) => JSON.parse(val));
            }
            const totalValues = await redisClient.LLEN(key);
            return {
                totalCount: totalValues,
                values: values,
                matchedCount: matchedCount,
            };
        } catch (e) {
            throw e;
        }
    };

    getOrdersByUserIdFromList = async (key, id, toSkip, toFetch, all) => {
        try {
            const stringifyValues = await redisClient.LRANGE(key, 0, -1);
            const parsedValues = stringifyValues.map((val) => JSON.parse(val));
            const matchedValues = parsedValues.filter(
                (val) => String(val.user._id) === String(id)
            );

            if (all) {
                return {
                    values: matchedValues,
                    totalCount: parsedValues.length,
                };
            }

            const values = matchedValues.slice(toSkip, toSkip + toFetch);
            const matchedCount = matchedValues.length;

            const totalValues = await redisClient.LLEN(key);
            return {
                totalCount: totalValues,
                values: values,
                matchedCount: matchedCount,
            };
        } catch (e) {
            throw e;
        }
    };

    getReviewsByProductNameFromList = async (key, toSkip, toFetch, search) => {
        try {
            const stringifyValues = await redisClient.LRANGE(key, 0, -1);
            const parsedValues = stringifyValues.map((val) => JSON.parse(val));
            const matchedValues = parsedValues.filter((val) =>
                val.product.name.toLowerCase().includes(search.toLowerCase())
            );
            const values = matchedValues.slice(toSkip, toSkip + toFetch);
            const matchedCount = matchedValues.length;

            const totalValues = await redisClient.LLEN(key);
            return {
                totalCount: totalValues,
                values: values,
                matchedCount: matchedCount,
            };
        } catch (e) {
            throw e;
        }
    };

    getAllValuesFromList = async (key) => {
        try {
            const stringifyValues = await redisClient.LRANGE(key, 0, -1);
            if (!stringifyValues) return stringifyValues;
            return stringifyValues.map((val) => JSON.parse(val));
        } catch (e) {
            throw e;
        }
    };

    removeValueFromList = async (key, value) => {
        try {
            await redisClient.LREM(key, 0, JSON.stringify(value));
        } catch (e) {
            throw e;
        }
    };

    updateValueInList = async (key, updatedValue) => {
        try {
            const oldValues = await redisClient.LRANGE(key, 0, -1);
            let index;
            for (let i in oldValues) {
                if (JSON.parse(oldValues[i])._id === String(updatedValue._id)) {
                    index = i;
                    break;
                }
            }
            await redisClient.LSET(key, index, JSON.stringify(updatedValue));
        } catch (e) {
            throw e;
        }
    };

    setValue = async (key, value) => {
        try {
            await redisClient.SET(key, JSON.stringify(value));
        } catch (e) {
            throw e;
        }
    };

    getValue = async (key) => {
        try {
            const value = await redisClient.GET(key);
            if (value) {
                return JSON.parse(value);
            } else {
                return value;
            }
        } catch (e) {
            throw e;
        }
    };

    deleteKey = async (key) => {
        try {
            const value = await redisClient.GET(key);
            if (value) {
                await redisClient.DEL(key);
            }
        } catch (e) {
            throw e;
        }
    };
}

module.exports = new RedisService();
