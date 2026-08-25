export interface TranslationDictionary {
  auth: {
    instituteNotFound: string;
    instituteBlocked: string;
    instituteDeactivated: string;
    invalidCredentials: string;
    multipleInstitutesFound: string;
    userDeactivated: string;
    userNotFound: string;
    invalidCurrentPassword: string;
    passwordChangedSuccess: string;
    logoutSuccess: string;
  };
  users: {
    userAlreadyExists: string;
    instituteAdminAllowedRolesOnly: string;
    clerkAllowedRolesOnly: string;
    unauthorizedUserCreation: string;
    userNotFound: string;
    cannotAccessSuperAdmin: string;
    clerkAccessStudentOnly: string;
    cannotEditSuperAdmin: string;
    clerkEditStudentOnly: string;
    phoneAlreadyInUse: string;
    cannotResetSuperAdminPassword: string;
    clerkResetStudentPasswordOnly: string;
    passwordResetSuccess: string;
    emptyImportFile: string;
    cannotDeleteSelf: string;
    cannotDeleteSuperAdmin: string;
    cannotDeleteWithDependencies: string;
    userDeletedSuccess: string;
  };
  students: {
    studentAlreadyExists: string;
    studentNotFound: string;
    unauthorizedStudentCreation: string;
    phoneAlreadyInUse: string;
    passwordResetSuccess: string;
  };
  institutes: {
    instituteNotFound: string;
    subdomainAlreadyExists: string;
    cannotDeleteWithDependencies: string;
    cannotDeleteSystemInstitute: string;
    instituteDeletedSuccess: string;
    moduleNotActive: string;
  };
  branches: {
    branchNotFound: string;
    branchAlreadyExists: string;
  };
  terms: {
    termNotFound: string;
    termAlreadyExists: string;
    invalidDateRange: string;
  };
  courses: {
    courseNotFound: string;
    courseAlreadyExists: string;
    prerequisiteNotFound: string;
    prerequisiteCycleDetected: string;
  };
  classes: {
    classNotFound: string;
    classAlreadyExists: string;
    classFull: string;
    invalidTermOrCourse: string;
  };
  grades: {
    gradesSubmittedSuccess: string;
    studentNotEnrolled: string;
    invalidScoreRange: string;
    studentLevelUpdatedSuccess: string;
  };
  common: {
    internalServerError: string;
    unauthorized: string;
    forbidden: string;
    badRequest: string;
    notFound: string;
  };
}

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;
