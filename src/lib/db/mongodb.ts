/**
 * MongoDB Connection
 * Singleton connection manager for MongoDB using Mongoose
 */

import mongoose, { Schema } from 'mongoose';

/**
 * Slow query threshold in milliseconds
 * Queries slower than this will be logged
 */
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10);

/**
 * Mongoose plugin for slow query logging
 * Logs queries that take longer than the threshold
 */
function slowQueryPlugin(schema: Schema): void {
  // Extend query prototype to add timing
  const queryMethods = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'countDocuments'] as const;

  queryMethods.forEach((method) => {
    schema.pre(method, function (this: mongoose.Query<unknown, unknown>) {
      // @ts-expect-error - Adding custom property for timing
      this._startTime = Date.now();
    });

    schema.post(method, function (this: mongoose.Query<unknown, unknown>) {
      // @ts-expect-error - Accessing custom property
      const startTime = this._startTime as number | undefined;
      if (startTime) {
        const duration = Date.now() - startTime;
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          const collection = this.model?.collection?.name || 'unknown';
          const operation = method;
          const filter = JSON.stringify(this.getFilter?.() || {});
          console.warn(
            `[SLOW QUERY] ${collection}.${operation} took ${duration}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`,
            { filter: filter.length > 200 ? filter.substring(0, 200) + '...' : filter }
          );
        }
      }
    });
  });

  // Handle aggregations separately
  schema.pre('aggregate', function (this: mongoose.Aggregate<unknown[]>) {
    // @ts-expect-error - Adding custom property for timing
    this._startTime = Date.now();
  });

  schema.post('aggregate', function (this: mongoose.Aggregate<unknown[]>) {
    // @ts-expect-error - Accessing custom property
    const startTime = this._startTime as number | undefined;
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        console.warn(
          `[SLOW QUERY] Aggregation took ${duration}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`,
          { pipeline: JSON.stringify(this.pipeline?.() || []).substring(0, 200) }
        );
      }
    }
  });
}

// Register slow query plugin globally
mongoose.plugin(slowQueryPlugin);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connection pool options optimized for production
 */
const connectionOptions = {
  // Buffer commands when disconnected (useful for serverless)
  bufferCommands: false,
  // Connection pool settings
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
  // Timeouts
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
  // Connection settings
  connectTimeoutMS: 10000, // Connection timeout
  heartbeatFrequencyMS: 10000, // How often to check server status
};

/**
 * Connect to MongoDB
 * Uses connection caching to prevent multiple connections in development
 */
export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions).then((mongoose) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('MongoDB connected successfully');
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB disconnected');
  }
}

/**
 * Get connection status
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
