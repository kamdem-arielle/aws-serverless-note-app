import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_UhvfJZNSU',
  ClientId: '6vtp7h07uuo2trafec2v0r55a4',
};

const userPool = new CognitoUserPool(poolData);

export const signUp = (
  name: string,
  familyName: string,
  email: string,
  password: string
): Promise<string> => {
  console.log('[signUp] Starting sign up for:', email);
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
      new CognitoUserAttribute({ Name: 'family_name', Value: familyName }),
    ];
    console.log('[signUp] Attributes:', attributeList.map(a => `${a.getName()}=${a.getValue()}`));

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        console.error('[signUp] Error:', err.message);
        reject(err);
        return;
      }
      const username = result!.user.getUsername();
      console.log('[signUp] Success, username:', username);
      resolve(username);
    });
  });
};

export const confirmRegistration = (
  username: string,
  code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    console.log('[confirmRegistration] Confirming code for:', username);
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('[confirmRegistration] Error:', err.message);
        reject(err);
        return;
      }
      console.log('[confirmRegistration] Success:', result);
      resolve(result);
    });
  });
};

export const resendConfirmationCode = (
  username: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    console.log('[resendConfirmationCode] Resending code for:', username);
    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        console.error('[resendConfirmationCode] Error:', err.message);
        reject(err);
        return;
      }
      console.log('[resendConfirmationCode] Code resent:', result);
      resolve(result);
    });
  });
};

export const signIn = (
  username: string,
  password: string
): Promise<{ accessToken: string; idToken: string; refreshToken: string }> => {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    console.log('[signIn] Authenticating user:', username);
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log('[signIn] Authentication successful');
        const tokens = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        };

        // localStorage.setItem('accessToken', tokens.accessToken);
        // localStorage.setItem('idToken', tokens.idToken);
        // localStorage.setItem('refreshToken', tokens.refreshToken);
        // console.log('[signIn] Tokens stored in localStorage');

        resolve(tokens);
      },
      onFailure: (err) => {
        console.error('[signIn] Error:', err.message);
        reject(err);
      },
    });
  });
};

export const parseIdToken = (
  idToken: string
): { sub: string; email: string; name: string } => {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  console.log('[parseIdToken] Decoded payload:', payload);
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  };
};

export const cognitoSignOut = (): void => {
  const user = userPool.getCurrentUser();
  if (user) {
    console.log('[cognitoSignOut] Signing out locally');
    user.signOut();
  }
};

export const cognitoGlobalSignOut = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      console.log('[cognitoGlobalSignOut] No user to sign out');
      resolve();
      return;
    }

    user.getSession((err: any) => {
      if (err) {
        console.error('[cognitoGlobalSignOut] getSession failed:', err.message);
        user.signOut();
        resolve();
        return;
      }

      console.log('[cognitoGlobalSignOut] Revoking tokens server-side');
      user.globalSignOut({
        onSuccess: (msg) => {
          console.log('[cognitoGlobalSignOut] Success:', msg);
          resolve();
        },
        onFailure: (err) => {
          console.error('[cognitoGlobalSignOut] Error:', err.message);
          user.signOut();
          reject(err);
        },
      });
    });
  });
};
