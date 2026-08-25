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
    emptyImportFile:
      'The uploaded spreadsheet is empty or has invalid structure',
  },
  students: {
    studentAlreadyExists:
      'A student with this phone number already exists in this institute',
    studentNotFound: 'Student not found',
    unauthorizedStudentCreation:
      'You do not have permission to create student accounts',
    phoneAlreadyInUse:
      'This phone number is already assigned to another user in this institute',
    passwordResetSuccess: 'Student password reset successfully',
  },
  institutes: {
    instituteNotFound: 'Requested institute was not found',
    subdomainAlreadyExists: 'An institute with this subdomain already exists',
    cannotDeleteWithDependencies:
      'Cannot delete institute with dependent records',
    cannotDeleteSystemInstitute: 'Cannot delete the system institute',
    instituteDeletedSuccess: 'Institute deleted successfully',
    moduleNotActive:
      'This module is not active for your institute subscription plan',
  },
  branches: {
    branchNotFound: 'Requested branch was not found',
    branchAlreadyExists:
      'A branch with this name already exists in this institute',
  },
  terms: {
    termNotFound: 'Requested term was not found',
    termAlreadyExists:
      'A term with this title already exists in this institute',
    invalidDateRange: 'End date must be after start date',
  },
  courses: {
    courseNotFound: 'Requested course was not found',
    courseAlreadyExists:
      'A course with this title already exists in this institute',
    prerequisiteNotFound: 'Selected prerequisite course was not found',
    prerequisiteCycleDetected:
      'Cannot create circular dependency in prerequisite chain',
  },
  classes: {
    classNotFound: 'Requested class was not found',
    classAlreadyExists:
      'A class with these specifications already exists in this term',
    classFull: 'This class has reached its maximum capacity',
    invalidTermOrCourse: 'Selected term or course is invalid',
  },
  grades: {
    gradesSubmittedSuccess:
      'Class grades recorded and student progression applied successfully',
    studentNotEnrolled: 'Student is not enrolled in this class',
    invalidScoreRange: 'Score must be a number between 0 and 100',
    studentLevelUpdatedSuccess: 'Student allowed level updated successfully',
  },
  common: {
    internalServerError: 'Internal server error occurred',
    unauthorized: 'Unauthorized access, please login again',
    forbidden: 'You do not have permission to perform this action',
    badRequest: 'Invalid request',
    notFound: 'Resource not found',
  },
};
