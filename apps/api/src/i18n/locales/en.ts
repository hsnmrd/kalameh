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
  users: {
    userAlreadyExists:
      'A user with this phone number already exists in this institute',
    instituteAdminAllowedRolesOnly:
      'Institute admin can only create Clerk or Student accounts',
    clerkAllowedRolesOnly: 'Clerk can only register new Student accounts',
    unauthorizedUserCreation:
      'You do not have permission to create user accounts',
    userNotFound: 'User not found',
    cannotAccessSuperAdmin: 'Access to this user information is not permitted',
    clerkAccessStudentOnly:
      'Clerks are only permitted to access Student information',
    cannotEditSuperAdmin: 'You cannot edit Super Admin accounts',
    clerkEditStudentOnly: 'Clerks are only permitted to edit Student accounts',
    phoneAlreadyInUse:
      'This phone number is already assigned to another user in this institute',
    cannotResetSuperAdminPassword:
      'You cannot reset the password of Super Admin accounts',
    clerkResetStudentPasswordOnly:
      'Clerks are only permitted to reset Student passwords',
    passwordResetSuccess: 'Password reset successfully',
  },
  common: {
    internalServerError: 'Internal server error occurred',
    unauthorized: 'Unauthorized access, please login again',
    forbidden: 'You do not have permission to perform this action',
    badRequest: 'Invalid request',
    notFound: 'Resource not found',
  },
};
