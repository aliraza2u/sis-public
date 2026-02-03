export const ErrorMessages = {
  AUTH: {
    USER_EXISTS: 'User already exists',
    USER_OR_ORG_EXISTS: 'User or Organization already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
    INVALID_RESET_TOKEN: 'Invalid or expired password reset token',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    NO_TENANT_FOUND: 'No tenant found. Please contact support.',
  },
  USER: {
    USER_NOT_FOUND: 'User not found',
  },
  EMAIL: {
    TRANSPORTER_NOT_INITIALIZED: 'Email transporter not initialized',
  },
};

export const SuccessMessages = {
  AUTH: {
    EMAIL_VERIFIED: 'Email verified successfully',
    PASSWORD_RESET_LINK_SENT: 'If this email exists, a password reset link has been sent.',
    PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
    LOGGED_OUT: 'Logged out successfully',
    ALREADY_VERIFIED: 'Email is already verified',
    VERIFICATION_EMAIL_SENT: 'Verification email sent',
  },
  EMAIL: {
    VERIFY_EMAIL_SUBJECT: 'Verify your email address',
    RESET_PASSWORD_SUBJECT: 'Reset your password',
  },
};
