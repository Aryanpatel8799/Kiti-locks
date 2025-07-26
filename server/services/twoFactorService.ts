import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

export class TwoFactorService {
  // Generate a new secret for 2FA
  static generateSecret(userEmail: string): {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } {
    const secret = speakeasy.generateSecret({
      name: `Kiti Locks (${userEmail})`,
      issuer: "Kiti Locks Admin",
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || "",
      backupCodes,
    };
  }

  // Generate backup codes for 2FA
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }

  // Generate QR code data URL
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }

  // Verify a token against a secret
  static verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 steps of time skew
    });
  }

  // Verify backup code
  static verifyBackupCode(
    code: string,
    backupCodes: string[],
  ): { valid: boolean; remainingCodes: string[] } {
    const normalizedCode = code.toUpperCase().replace(/\s/g, "");
    const codeIndex = backupCodes.indexOf(normalizedCode);

    if (codeIndex === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    // Remove the used backup code
    const remainingCodes = backupCodes.filter(
      (_, index) => index !== codeIndex,
    );

    return { valid: true, remainingCodes };
  }

  // Hash backup codes for secure storage
  static hashBackupCodes(codes: string[]): string[] {
    return codes.map((code) => {
      return crypto.createHash("sha256").update(code).digest("hex");
    });
  }

  // Verify hashed backup code
  static verifyHashedBackupCode(
    code: string,
    hashedCodes: string[],
  ): { valid: boolean; remainingCodes: string[] } {
    const hashedCode = crypto
      .createHash("sha256")
      .update(code.toUpperCase().replace(/\s/g, ""))
      .digest("hex");
    const codeIndex = hashedCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return { valid: false, remainingCodes: hashedCodes };
    }

    // Remove the used backup code
    const remainingCodes = hashedCodes.filter(
      (_, index) => index !== codeIndex,
    );

    return { valid: true, remainingCodes };
  }

  // Rate limiting for 2FA attempts
  private static attemptCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  static checkRateLimit(identifier: string): {
    allowed: boolean;
    remainingAttempts: number;
  } {
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();

    const attempts = this.attemptCounts.get(identifier);

    if (!attempts || now > attempts.resetTime) {
      this.attemptCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    if (attempts.count >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0 };
    }

    attempts.count++;
    return { allowed: true, remainingAttempts: maxAttempts - attempts.count };
  }

  static resetRateLimit(identifier: string): void {
    this.attemptCounts.delete(identifier);
  }
}

export default TwoFactorService;
