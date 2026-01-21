/**
 * Email Queue
 * Simple in-memory queue with retry logic for reliable email delivery
 */

import nodemailer from 'nodemailer';
import { EMAIL_CONFIG, isEmailConfigured } from './config';

export interface EmailJob {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: Date;
  scheduledAt?: Date;
}

interface QueueOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  processingIntervalMs?: number;
}

const DEFAULT_OPTIONS: Required<QueueOptions> = {
  maxAttempts: 3,
  retryDelayMs: 5000, // 5 seconds
  processingIntervalMs: 1000, // 1 second
};

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;
  private options: Required<QueueOptions>;
  private transporter: nodemailer.Transporter | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(options: QueueOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the email transporter
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (!isEmailConfigured()) {
      console.warn('Email is not configured. Emails will not be sent.');
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: EMAIL_CONFIG.auth,
      });
    }

    return this.transporter;
  }

  /**
   * Add an email to the queue
   */
  enqueue(email: Omit<EmailJob, 'id' | 'attempts' | 'createdAt' | 'maxAttempts'>): string {
    const job: EmailJob = {
      ...email,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      maxAttempts: this.options.maxAttempts,
      createdAt: new Date(),
    };

    this.queue.push(job);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Email queued: ${job.id} to ${job.to}`);
    }

    // Start processing if not already running
    this.startProcessing();

    return job.id;
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.options.processingIntervalMs);
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process the next item in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    const job = this.queue.find(
      (j) => j.attempts < j.maxAttempts && (!j.scheduledAt || j.scheduledAt <= new Date())
    );

    if (!job) {
      // Clean up completed/failed jobs
      this.queue = this.queue.filter((j) => j.attempts < j.maxAttempts);

      // Stop processing if queue is empty
      if (this.queue.length === 0) {
        this.stopProcessing();
      }
      return;
    }

    this.processing = true;

    try {
      await this.sendEmail(job);
      // Remove successful job from queue
      this.queue = this.queue.filter((j) => j.id !== job.id);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`Email sent successfully: ${job.id} to ${job.to}`);
      }
    } catch (error) {
      job.attempts++;
      job.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (job.attempts >= job.maxAttempts) {
        console.error(`Email failed after ${job.attempts} attempts: ${job.id}`, job.lastError);
        // Keep failed jobs in queue for inspection but mark them
      } else {
        // Schedule retry
        job.scheduledAt = new Date(Date.now() + this.options.retryDelayMs * job.attempts);
        console.warn(
          `Email failed (attempt ${job.attempts}/${job.maxAttempts}): ${job.id}. Retrying at ${job.scheduledAt.toISOString()}`
        );
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Send an email using nodemailer
   */
  private async sendEmail(job: EmailJob): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      // In development without email config, just log
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[DEV] Would send email to ${job.to}: ${job.subject}`);
      }
      return;
    }

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: job.to,
      subject: job.subject,
      html: job.html,
      text: job.text,
    });
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    failed: number;
    processing: boolean;
  } {
    const pending = this.queue.filter((j) => j.attempts < j.maxAttempts).length;
    const failed = this.queue.filter((j) => j.attempts >= j.maxAttempts).length;

    return {
      pending,
      failed,
      processing: this.processing,
    };
  }

  /**
   * Get failed jobs
   */
  getFailedJobs(): EmailJob[] {
    return this.queue.filter((j) => j.attempts >= j.maxAttempts);
  }

  /**
   * Clear all jobs from the queue
   */
  clear(): void {
    this.queue = [];
    this.stopProcessing();
  }

  /**
   * Retry a failed job
   */
  retry(jobId: string): boolean {
    const job = this.queue.find((j) => j.id === jobId);
    if (job) {
      job.attempts = 0;
      job.scheduledAt = undefined;
      job.lastError = undefined;
      this.startProcessing();
      return true;
    }
    return false;
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();

// Export for direct sending without queue (for critical emails)
export async function sendEmailDirect(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[DEV] Would send email to ${options.to}: ${options.subject}`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth,
  });

  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    ...options,
  });
}
