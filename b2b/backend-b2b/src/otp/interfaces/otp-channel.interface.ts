export interface OtpSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OtpChannel {
  readonly name: string;

  /**
   * Dispatches the 6-digit OTP code to the target destination
   * @param destination Target phone number (E.164) or channel identifier
   * @param code 6-digit one-time password
   * @param metadata Optional metadata (e.g. telegram_id, language, ip)
   */
  sendOtp(
    destination: string,
    code: string,
    metadata?: Record<string, unknown>,
  ): Promise<OtpSendResult>;
}
