import type { TranslationDictionary } from '../i18n.types';

export const en: TranslationDictionary = {
  auth: {
    instituteNotFound: 'Requested institute was not found',
    instituteBlocked: 'Access for this institute has been suspended',
    instituteDeactivated: 'Your institute is currently deactivated',
    invalidCredentials: 'Invalid phone number or password',
    multipleInstitutesFound:
      'This phone number exists in multiple institutes. Please specify your institute subdomain or ID',
    userDeactivated: 'Your account has been deactivated',
    userNotFound: 'User not found',
    invalidCurrentPassword: 'Current password is incorrect',
    passwordChangedSuccess: 'Password has been updated successfully',
    logoutSuccess: 'Logged out successfully',
  },
  common: {
    internalServerError: 'Internal server error occurred',
    unauthorized: 'Unauthorized access, please login again',
    forbidden: 'You do not have permission to perform this action',
    badRequest: 'Invalid request',
    notFound: 'Resource not found',
  },
};
