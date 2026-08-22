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
  };
  institutes: {
    instituteNotFound: string;
    subdomainAlreadyExists: string;
    cannotDeleteWithDependencies: string;
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
